"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Trash2, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

type BulkActionConfig = {
  key: string;
  label: string;
  action: "retryStatus" | "cleanStatus" | "drainQueue";
  status?: "failed" | "completed" | "waiting" | "delayed" | "active" | "all";
  icon: React.ComponentType<{ className?: string }>;
  highlightCount?: (counts: QueueCounts) => number;
  description: string;
};

const ACTIONS: BulkActionConfig[] = [
  {
    key: "retry-failed",
    label: "重试全部失败",
    action: "retryStatus",
    status: "failed",
    icon: RotateCcw,
    description: "将失败任务重新入队执行",
    highlightCount: (counts) => counts.failed,
  },
  {
    key: "clean-completed",
    label: "清理成功记录",
    action: "cleanStatus",
    status: "completed",
    icon: Trash2,
    description: "移除所有已完成任务的历史记录",
    highlightCount: (counts) => counts.completed,
  },
  {
    key: "flush-waiting",
    label: "清空排队任务",
    action: "drainQueue",
    icon: Trash2,
    description: "立即移除所有排队与延迟任务",
    highlightCount: (counts) => counts.waiting + counts.delayed,
  },
  {
    key: "clean-active",
    label: "终止运行中任务",
    action: "cleanStatus",
    status: "active",
    icon: Activity,
    description: "尝试中止所有运行中的任务",
    highlightCount: (counts) => counts.active,
  },
];

type QueueBulkActionsProps = {
  counts: QueueCounts | null;
  disabled?: boolean;
};

export function QueueBulkActions({ counts, disabled = false }: QueueBulkActionsProps) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (config: BulkActionConfig) => {
    if (disabled) {
      return;
    }
    setPendingKey(config.key);
    setError(null);
    try {
      const response = await fetch("/api/tasks/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: config.action,
          status: config.status,
        }),
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
      setError(err instanceof Error ? err.message : "操作失败，请稍后再试");
    } finally {
      setPendingKey(null);
    }
  };

  if (!counts) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        队列未配置或当前不可用。配置 <code className="rounded bg-muted px-1 py-0.5 text-[10px]">REDIS_URL</code>{" "}
        后刷新页面即可使用批量控制。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {ACTIONS.map((config) => {
          const Icon = config.icon;
          const count = config.highlightCount ? config.highlightCount(counts) : 0;
          const isDisabled = disabled || count === 0;
          return (
            <Button
              key={config.key}
              variant="outline"
              size="sm"
              disabled={isDisabled || pendingKey === config.key}
              className={cn(
                "h-auto items-start justify-start rounded-lg py-3 text-left",
                count > 0 ? "border-primary/50" : "",
              )}
              onClick={() => runAction(config)}
            >
              {pendingKey === config.key ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon className="mr-2 h-4 w-4" />
              )}
              <span className="flex flex-col text-xs leading-5">
                <span className="font-medium text-foreground">
                  {config.label}
                  {count > 0 ? `（${count}）` : ""}
                </span>
                <span className="text-muted-foreground">{config.description}</span>
              </span>
            </Button>
          );
        })}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
