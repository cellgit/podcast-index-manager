"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [rows, setRows] = useState<TaskLog[]>(logs);
  const [selected, setSelected] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<SyncStatus | "ALL">("ALL");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(logs);
    setSelected((prev) => prev.filter((id) => logs.some((log) => log.id === id)));
  }, [logs]);

  const allIds = useMemo(() => rows.map((log) => log.id), [rows]);
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
      setRows((prev) => prev.filter((row) => !selected.includes(row.id)));
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
      setBulkDialogOpen(false);
    }
  };

  const visibleRows =
    filter === "ALL" ? rows : rows.filter((row) => row.status === filter);

  const statusCounts = useMemo(() => {
    const counts: Record<SyncStatus, number> = {
      [SyncStatus.PENDING]: 0,
      [SyncStatus.RUNNING]: 0,
      [SyncStatus.SUCCESS]: 0,
      [SyncStatus.FAILED]: 0,
    };
    rows.forEach((row) => {
      counts[row.status] += 1;
    });
    return counts;
  }, [rows]);

  const handleSingleDelete = (logId: number) => {
    setRows((prev) => prev.filter((row) => row.id !== logId));
    setSelected((prev) => prev.filter((id) => id !== logId));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">状态筛选：</span>
          <StatusFilterChip
            label="全部"
            active={filter === "ALL"}
            count={rows.length}
            onClick={() => setFilter("ALL")}
          />
          <StatusFilterChip
            label="排队中"
            active={filter === SyncStatus.PENDING}
            count={statusCounts[SyncStatus.PENDING]}
            onClick={() => setFilter(SyncStatus.PENDING)}
          />
          <StatusFilterChip
            label="运行中"
            active={filter === SyncStatus.RUNNING}
            count={statusCounts[SyncStatus.RUNNING]}
            onClick={() => setFilter(SyncStatus.RUNNING)}
          />
          <StatusFilterChip
            label="成功"
            active={filter === SyncStatus.SUCCESS}
            count={statusCounts[SyncStatus.SUCCESS]}
            onClick={() => setFilter(SyncStatus.SUCCESS)}
          />
          <StatusFilterChip
            label="失败"
            active={filter === SyncStatus.FAILED}
            count={statusCounts[SyncStatus.FAILED]}
            onClick={() => setFilter(SyncStatus.FAILED)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            已选择 <span className="font-medium text-foreground">{selected.length}</span> / {rows.length} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAll}
              disabled={rows.length === 0}
              className="gap-1"
            >
              {isAllSelected ? "取消全选" : "全选"}
            </Button>
            <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={selected.length === 0 || deleting}
                  className="gap-1"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  删除所选
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>删除选中的任务记录</AlertDialogTitle>
                  <AlertDialogDescription>
                    即将删除 {selected.length} 条任务记录，确认后操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
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
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  暂无任务记录。
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((log) => {
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
                        onDeleteSuccess={handleSingleDelete}
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

type StatusFilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

function StatusFilterChip({ label, count, active, onClick }: StatusFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-sm transition"
          : "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
      }
    >
      <span>{label}</span>
      <span className="text-[10px] text-muted-foreground">{count}</span>
    </button>
  );
}
