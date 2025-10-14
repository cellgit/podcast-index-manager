"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SyncPodcastButtonProps {
  feedId: number;
}

type SyncState = "idle" | "loading" | "success" | "error";

export function SyncPodcastButton({ feedId }: SyncPodcastButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSync() {
    setState("loading");
    setMessage("开始同步");
    try {
      const response = await fetch(`/api/podcast/${feedId}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`同步失败（${response.status}）`);
      }
      const result = (await response.json()) as {
        episodesAdded: number;
      };
      setState("success");
      setMessage(`已同步 ${result.episodesAdded} 条节目`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "与 PodcastIndex 同步失败",
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleSync}
        size="sm"
        variant="secondary"
        disabled={state === "loading"}
        className="justify-center"
      >
        <span className="flex items-center gap-2 text-sm">
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          {state === "loading" ? "正在同步" : "从 PodcastIndex 同步"}
        </span>
      </Button>
      {message ? (
        <span
          className={cn(
            "text-xs",
            state === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
