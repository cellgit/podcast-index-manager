"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Trash2, Rocket, FileX } from "lucide-react";
import { SyncStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";

type QueueJobActionsProps = {
  logId: number;
  jobId: string;
  syncStatus: SyncStatus;
};

export function QueueJobActions({ logId, jobId, syncStatus }: QueueJobActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"retry" | "remove" | "promote" | "delete-log" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    action: "retryJob" | "removeJob" | "promoteJob",
    nextPending: "retry" | "remove" | "promote",
  ) => {
    setPending(nextPending);
    setError(null);
    try {
      const response = await fetch("/api/tasks/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, jobId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : `操作失败（${response.status}）`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setPending(null);
    }
  };

  const deleteLog = async () => {
    if (pending) {
      return;
    }
    setPending("delete-log");
    setError(null);
    try {
      const response = await fetch("/api/tasks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logIds: [logId] }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : `删除失败（${response.status}）`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setPending(null);
    }
  };

  const isPending = pending !== null;

  const allowRetry = jobId && syncStatus === SyncStatus.FAILED;
  const allowPromote = jobId && syncStatus === SyncStatus.PENDING;
  const allowRemove = jobId && (syncStatus === SyncStatus.PENDING || syncStatus === SyncStatus.FAILED);

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      {jobId ? (
        <span className="font-mono text-[11px] text-muted-foreground">#{jobId}</span>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        {allowRetry ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run("retryJob", "retry")}
            className="h-7 gap-1 text-[11px]"
          >
            {pending === "retry" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            重试
          </Button>
        ) : null}
        {allowPromote ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run("promoteJob", "promote")}
            className="h-7 gap-1 text-[11px]"
          >
            {pending === "promote" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            立即执行
          </Button>
        ) : null}
        {allowRemove ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run("removeJob", "remove")}
            className="h-7 gap-1 text-[11px]"
          >
            {pending === "remove" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            移除
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={deleteLog}
          className="h-7 gap-1 text-[11px]"
        >
          {pending === "delete-log" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileX className="h-3.5 w-3.5" />
          )}
          删除记录
        </Button>
        {!jobId ? (
          <span className="self-center text-[11px] text-muted-foreground">无队列关联</span>
        ) : null}
      </div>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
