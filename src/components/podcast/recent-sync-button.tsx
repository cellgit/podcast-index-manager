"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";

type SyncState = "idle" | "loading" | "success" | "error";

export function RecentSyncButton() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const triggerSync = async () => {
    setState("loading");
    setMessage("开始同步 PodcastIndex 增量数据…");
    try {
      const response = await fetch("/api/podcast/recent/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : `同步失败（${response.status}）`,
        );
      }
      if (result?.queued) {
        setState("success");
        setMessage(`已提交任务至队列，Job ID: ${result.jobId ?? "unknown"}`);
      } else {
        const feeds = result?.summary?.feedsProcessed ?? 0;
        const episodes = result?.summary?.episodesProcessed ?? 0;
        setState("success");
        setMessage(`已处理 ${feeds} 个播客 / ${episodes} 条节目`);
      }
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "同步失败");
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={triggerSync}
        disabled={state === "loading"}
        className="w-full items-center justify-center gap-2 whitespace-normal px-4 py-3 text-[21px] leading-6"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        <span className="max-w-[220px] text-center">
          立即同步增量
        </span>
      </Button>
      {message ? (
        <p
          className={
            state === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
