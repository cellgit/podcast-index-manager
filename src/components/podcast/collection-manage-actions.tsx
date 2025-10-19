"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  id: number;
  name: string;
  description?: string | null;
};

export function CollectionManageActions({ id, name, description }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [nextName, setNextName] = useState(name);
  const [nextDescription, setNextDescription] = useState(description ?? "");
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setNextName(name);
    setNextDescription(description ?? "");
    setMode("view");
    setState("idle");
    setMessage(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nextName.trim()) {
      setState("error");
      setMessage("名称不能为空");
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch(`/api/library/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName.trim(),
          description: nextDescription.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `更新失败（${response.status}）`,
        );
      }
      setState("success");
      setMessage("已更新收藏集");
      setMode("view");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "更新失败");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("确认删除该收藏集及其关联？此操作不可恢复。")) {
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch(`/api/library/collections/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `删除失败（${response.status}）`,
        );
      }
      setState("success");
      setMessage("已删除收藏集");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  };

  if (mode === "edit") {
    return (
      <form onSubmit={handleSave} className="space-y-2">
        <div className="grid gap-2">
          <Input
            value={nextName}
            onChange={(event) => setNextName(event.target.value)}
            placeholder="收藏集名称"
            required
          />
          <textarea
            value={nextDescription}
            onChange={(event) => setNextDescription(event.target.value)}
            placeholder="收藏集描述（可选）"
            className="min-h-[80px] rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetForm}
            disabled={state === "loading"}
            className="gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            取消
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={state === "loading"}
            className="gap-1 text-xs"
          >
            {state === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            保存
          </Button>
        </div>
        {message ? (
          <p className={state === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => setMode("edit")}
        >
          <Pencil className="h-3.5 w-3.5" />
          编辑
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1 text-xs"
          onClick={handleDelete}
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          删除
        </Button>
      </div>
      {message ? (
        <p className={state === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
