"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SyncStatus } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueueJobActions } from "@/components/tasks/queue-job-actions";

type TaskLog = {
  id: number;
  jobType: string;
  status: SyncStatus;
  startedAt: string;
  finishedAt: string | null;
  message: string | null;
  podcast: { id: number; title: string } | null;
  queueJobId: string | null;
};

const STATUS_META: Record<
  SyncStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "outline" }
> = {
  [SyncStatus.SUCCESS]: { label: "成功", variant: "success" },
  [SyncStatus.FAILED]: { label: "失败", variant: "destructive" },
  [SyncStatus.RUNNING]: { label: "运行中", variant: "warning" },
  [SyncStatus.PENDING]: { label: "排队中", variant: "outline" },
};

type TaskLogPanelProps = {
  logs: TaskLog[];
};

export function TaskLogPanel({ logs }: TaskLogPanelProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const allIds = useMemo(() => logs.map((log) => log.id), [logs]);
  const isAllSelected = selected.length > 0 && selected.length === allIds.length;

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === allIds.length ? [] : [...allIds]));
  };

  const deleteSelected = async () => {
    if (selected.length === 0 || deleting) {
      return;
    }
    if (!window.confirm(`确认删除选中的 ${selected.length} 条任务记录吗？`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logIds: selected }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `删除失败（${response.status}）`,
        );
      }
      setSelected([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          已选择 <span className="font-medium text-foreground">{selected.length}</span> / {logs.length} 条记录
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleAll}
            disabled={logs.length === 0}
            className="gap-1"
          >
            {isAllSelected ? "取消全选" : "全选"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={deleteSelected}
            disabled={selected.length === 0 || deleting}
            className="gap-1"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            删除所选
          </Button>
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  aria-label="全选"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border/70"
                />
              </TableHead>
              <TableHead>订阅源</TableHead>
              <TableHead>任务</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>结束时间</TableHead>
              <TableHead>说明</TableHead>
              <TableHead className="text-right">队列控制</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  暂无任务记录。
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const statusMeta = STATUS_META[log.status];
                return (
                  <TableRow key={log.id} className={selected.includes(log.id) ? "bg-muted/40" : undefined}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`选择任务 ${log.id}`}
                        checked={selected.includes(log.id)}
                        onChange={() => toggle(log.id)}
                        className="h-4 w-4 rounded border-border/70"
                      />
                    </TableCell>
                    <TableCell>
                      {log.podcast ? (
                        <a
                          href={`/podcast/${log.podcast.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {log.podcast.title}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">未关联</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.jobType}</TableCell>
                    <TableCell>
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(new Date(log.startedAt))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.finishedAt ? formatDateTime(new Date(log.finishedAt)) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.message ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <QueueJobActions
                        logId={log.id}
                        jobId={log.queueJobId ?? ""}
                        syncStatus={log.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
}
