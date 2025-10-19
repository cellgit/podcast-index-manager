"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react";
import {
  PodcastEditorialPriority,
  PodcastEditorialStatus,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditorialSnapshot = {
  display_title: string | null;
  display_author: string | null;
  display_image: string | null;
  status: PodcastEditorialStatus;
  priority: PodcastEditorialPriority;
  tags: string[];
  notes: string | null;
};

type Defaults = {
  title: string;
  author: string | null;
  image: string | null;
};

type Props = {
  podcastId: number;
  editorial: EditorialSnapshot | null;
  defaults: Defaults;
};

const STATUS_OPTIONS: Array<{ value: PodcastEditorialStatus; label: string }> = [
  { value: PodcastEditorialStatus.ACTIVE, label: "正常运营" },
  { value: PodcastEditorialStatus.PAUSED, label: "暂停曝光" },
  { value: PodcastEditorialStatus.ARCHIVED, label: "归档" },
];

const PRIORITY_OPTIONS: Array<{ value: PodcastEditorialPriority; label: string }> = [
  { value: PodcastEditorialPriority.HIGH, label: "高优先级" },
  { value: PodcastEditorialPriority.NORMAL, label: "普通" },
  { value: PodcastEditorialPriority.LOW, label: "低优先级" },
];

export function PodcastLibraryActions({ podcastId, editorial, defaults }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [displayTitle, setDisplayTitle] = useState(editorial?.display_title ?? "");
  const [displayAuthor, setDisplayAuthor] = useState(editorial?.display_author ?? "");
  const [displayImage, setDisplayImage] = useState(editorial?.display_image ?? "");
  const [status, setStatus] = useState(editorial?.status ?? PodcastEditorialStatus.ACTIVE);
  const [priority, setPriority] = useState(editorial?.priority ?? PodcastEditorialPriority.NORMAL);
  const [tagsInput, setTagsInput] = useState(editorial?.tags?.join(", ") ?? "");
  const [notes, setNotes] = useState(editorial?.notes ?? "");
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setMode("view");
    setDisplayTitle(editorial?.display_title ?? "");
    setDisplayAuthor(editorial?.display_author ?? "");
    setDisplayImage(editorial?.display_image ?? "");
    setStatus(editorial?.status ?? PodcastEditorialStatus.ACTIVE);
    setPriority(editorial?.priority ?? PodcastEditorialPriority.NORMAL);
    setTagsInput(editorial?.tags?.join(", ") ?? "");
    setNotes(editorial?.notes ?? "");
    setState("idle");
    setMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setMessage(null);

    const tags = tagsInput
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      const response = await fetch(`/api/library/podcasts/${podcastId}/editorial`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayTitle: displayTitle.trim() || undefined,
          displayAuthor: displayAuthor.trim() || undefined,
          displayImage: displayImage.trim() || undefined,
          status,
          priority,
          tags,
          notes: notes.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `更新失败（${response.status}）`,
        );
      }
      setState("success");
      setMessage("已保存自定义元数据");
      setMode("view");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "更新失败");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("确认删除该播客及其节目记录？此操作不可恢复。")) {
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch(`/api/library/podcasts/${podcastId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `删除失败（${response.status}）`,
        );
      }
      setState("success");
      setMessage("已删除播客");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  };

  if (mode === "edit") {
    return (
      <form onSubmit={handleSubmit} className="w-full space-y-2 rounded-md border border-border/60 bg-background px-3 py-3 text-xs">
        <div className="grid gap-2">
          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">展示标题（留空沿用源数据：{defaults.title}）</span>
            <Input value={displayTitle} onChange={(event) => setDisplayTitle(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">展示作者（留空沿用：{defaults.author ?? "未知"}）</span>
            <Input value={displayAuthor} onChange={(event) => setDisplayAuthor(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">展示封面 URL（留空沿用源数据）</span>
            <Input value={displayImage} onChange={(event) => setDisplayImage(event.target.value)} placeholder={defaults.image ?? "https://"} />
          </label>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[11px] text-muted-foreground">运营状态</span>
              <select
                className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                value={status}
                onChange={(event) => setStatus(event.target.value as PodcastEditorialStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-muted-foreground">运营优先级</span>
              <select
                className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                value={priority}
                onChange={(event) => setPriority(event.target.value as PodcastEditorialPriority)}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">标签（使用逗号或空格分隔）</span>
            <Input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="专题 高优" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">运营备注</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[80px] rounded-md border border-border/60 bg-background px-3 py-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="记录人工审核结论、上线渠道等信息"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={resetForm}
            disabled={state === "loading"}
          >
            <X className="h-3.5 w-3.5" />
            取消
          </Button>
          <Button
            type="submit"
            size="sm"
            className="gap-1"
            disabled={state === "loading"}
          >
            {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            保存
          </Button>
        </div>
        {message ? (
          <p className={state === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{message}</p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setMode("edit")}
        >
          <Pencil className="h-3.5 w-3.5" />
          编辑元数据
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1"
          onClick={handleDelete}
          disabled={state === "loading"}
        >
          {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          删除播客
        </Button>
      </div>
      {editorial ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>状态：{STATUS_OPTIONS.find((item) => item.value === editorial.status)?.label ?? editorial.status}</span>
          <span>优先级：{PRIORITY_OPTIONS.find((item) => item.value === editorial.priority)?.label ?? editorial.priority}</span>
          {editorial.tags.length ? <span>标签：{editorial.tags.join(", ")}</span> : null}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">尚未设置自定义元数据，使用原始抓取信息。</p>
      )}
      {message ? (
        <p className={state === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{message}</p>
      ) : null}
    </div>
  );
}
