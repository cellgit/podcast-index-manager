"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CollectionCreateForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setMessage("名称不能为空");
      setState("error");
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/library/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `创建失败（${response.status}）`,
        );
      }
      setState("success");
      setMessage("已创建收藏集");
      setName("");
      setDescription("");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "创建失败");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="收藏集名称"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        placeholder="可选描述"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Button type="submit" size="sm" disabled={state === "loading"} className="w-full">
        {state === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        创建收藏集
      </Button>
      {message ? (
        <p className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
