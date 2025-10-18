"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DiscoveryImportResult = {
  success: boolean;
  message: string;
  podcastId?: number;
};

type DiscoveryImportButtonProps = {
  feedId?: number;
  guid?: string | null;
  url?: string | null;
  label?: ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  onResult?: (result: DiscoveryImportResult) => void;
  showStatus?: boolean;
};

export function DiscoveryImportButton({
  feedId,
  guid,
  url,
  label = "加入目录",
  variant = "default",
  size = "sm",
  className,
  onResult,
  showStatus = false,
}: DiscoveryImportButtonProps) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<DiscoveryImportResult | null>(null);

  const handleClick = async () => {
    const payload =
      feedId !== undefined
        ? { feedId }
        : guid
          ? { guid }
          : url
            ? { feedUrl: url }
            : null;

    if (!payload) {
      const result: DiscoveryImportResult = {
        success: false,
        message: "无法提取订阅源的唯一标识符，请手动输入。",
      };
      setStatus(result);
      onResult?.(result);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, syncEpisodes: true }),
      });
      const resultBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof resultBody?.error === "string"
            ? resultBody.error
            : `导入失败（${response.status}）`,
        );
      }
      const message =
        typeof resultBody?.podcast?.title === "string"
          ? `已加入《${resultBody.podcast.title}》`
          : "订阅源导入成功";
      const result: DiscoveryImportResult = {
        success: true,
        message,
        podcastId:
          typeof resultBody?.podcast?.id === "number" ? resultBody.podcast.id : undefined,
      };
      setStatus(result);
      onResult?.(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "导入失败，请稍后重试。";
      const result: DiscoveryImportResult = { success: false, message };
      setStatus(result);
      onResult?.(result);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button variant={variant} size={size} onClick={handleClick} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
      </Button>
      {showStatus && status ? (
        <p className={cn("text-xs", status.success ? "text-muted-foreground" : "text-destructive")}>
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
