import { SyncStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Clock, ClipboardList, AlertTriangle, CheckCircle, Server } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { RecentSyncButton } from "@/components/podcast/recent-sync-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TasksPageProps = {
  searchParams: Promise<{
    status?: SyncStatus | "ALL";
  }>;
};

const DEFAULT_TAKE = 100;

const extractErrorMessage = (value: Prisma.JsonValue | null | undefined) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  if (Array.isArray(value)) {
    return undefined;
  }
  const message = (value as Record<string, unknown>).message;
  return typeof message === "string" ? message : undefined;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const db = prisma;
  if (!db) {
    return null;
  }

  const params = await searchParams;
  const statusFilter = params.status && params.status !== "ALL" ? params.status : null;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [pendingCount, runningCount, success24h, failed24h, logs, cursorInfo, workers] = await Promise.all([
    db.syncLog.count({ where: { status: SyncStatus.PENDING } }),
    db.syncLog.count({ where: { status: SyncStatus.RUNNING } }),
    db.syncLog.count({
      where: { status: SyncStatus.SUCCESS, started_at: { gte: since24h } },
    }),
    db.syncLog.count({
      where: { status: SyncStatus.FAILED, started_at: { gte: since24h } },
    }),
    db.syncLog.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { started_at: "desc" },
      take: DEFAULT_TAKE,
      include: {
        podcast: {
          select: { id: true, title: true },
        },
      },
    }),
    db.syncCursor.findMany({
      orderBy: { updated_at: "desc" },
      take: 50,
    }),
    db.syncWorker.findMany({
      orderBy: { last_seen: "desc" },
    }),
  ]);

  const statusBadges: Record<SyncStatus, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
    [SyncStatus.PENDING]: { label: "排队中", variant: "secondary" },
    [SyncStatus.RUNNING]: { label: "运行中", variant: "warning" },
    [SyncStatus.SUCCESS]: { label: "成功", variant: "success" },
    [SyncStatus.FAILED]: { label: "失败", variant: "destructive" },
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">抓取任务</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">拉取任务中心</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/library">返回内容库</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="排队任务"
            value={pendingCount}
            description="等待 Worker 执行的同步请求"
            icon={ClipboardList}
          />
          <StatusCard
            title="运行中"
            value={runningCount}
            description="当前正在抓取 PodcastIndex"
            icon={Clock}
            tone="warning"
          />
          <StatusCard
            title="24 小时内成功"
            value={success24h}
            description="最近 24 小时内成功完成的任务"
            icon={CheckCircle}
          />
          <StatusCard
            title="24 小时内失败"
            value={failed24h}
            description="需要关注的失败或超时任务"
            icon={AlertTriangle}
            tone="danger"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">任务队列</CardTitle>
              <CardDescription>
                展示最近 {DEFAULT_TAKE} 条同步记录，可按状态筛选排查异常任务。
              </CardDescription>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>筛选：</span>
                <div className="flex items-center gap-2">
                  <StatusFilterLink label="全部" href="/tasks" active={!statusFilter} />
                  <StatusFilterLink
                    label="排队中"
                    href="/tasks?status=PENDING"
                    active={statusFilter === SyncStatus.PENDING}
                  />
                  <StatusFilterLink
                    label="运行中"
                    href="/tasks?status=RUNNING"
                    active={statusFilter === SyncStatus.RUNNING}
                  />
                  <StatusFilterLink
                    label="成功"
                    href="/tasks?status=SUCCESS"
                    active={statusFilter === SyncStatus.SUCCESS}
                  />
                  <StatusFilterLink
                    label="失败"
                    href="/tasks?status=FAILED"
                    active={statusFilter === SyncStatus.FAILED}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订阅源</TableHead>
                    <TableHead>任务</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>结束时间</TableHead>
                    <TableHead>说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        暂无任务记录。
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.podcast ? (
                            <Link
                              href={`/podcast/${log.podcast.id}`}
                              className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {log.podcast.title}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">未关联</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{log.job_type}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadges[log.status].variant}>
                            {statusBadges[log.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(log.started_at)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.finished_at ? formatDateTime(log.finished_at) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.message ?? extractErrorMessage(log.error) ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">增量同步</CardTitle>
                <CardDescription>
                  立即从 PodcastIndex /recent/data 获取最新更新，保持目录新鲜。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSyncButton />
              </CardContent>
            </Card>

            <Card id="workers" className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Worker 状态</CardTitle>
                <CardDescription>
                  显示最近更新的抓取游标，确认 Worker 定时任务是否按时运行。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Worker 心跳</p>
                  {workers.length === 0 ? (
                    <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                      暂无 Worker 心跳，检查是否已运行 `npm run worker:sync-recent`。
                    </div>
                  ) : (
                    workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{worker.name}</p>
                          <p className="text-muted-foreground">
                            最近心跳：{formatRelative(worker.last_seen)}
                          </p>
                        </div>
                        <Badge variant={worker.status === "online" ? "success" : worker.status === "error" ? "destructive" : "outline"} className="uppercase">
                          {worker.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">同步游标</p>
                  {cursorInfo.length === 0 ? (
                    <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                      尚未生成任何游标。首次同步后会记录最近处理的位置。
                    </div>
                  ) : (
                    cursorInfo.map((cursor) => (
                      <div
                        key={cursor.id}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{cursor.id}</p>
                          <p className="text-muted-foreground">
                            最近更新：{formatRelative(cursor.updated_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Server className="h-3 w-3" />
                          {cursor.cursor}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}

type StatusCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "danger";
};

function StatusCard({ title, value, description, icon: Icon, tone = "default" }: StatusCardProps) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200/40 bg-amber-50 dark:bg-amber-900/20"
      : tone === "danger"
        ? "border-destructive/40 bg-destructive/10"
        : "border-border/70";
  return (
    <Card className={toneClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value.toLocaleString()}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

type StatusFilterLinkProps = {
  label: string;
  href: string;
  active: boolean;
};

function StatusFilterLink({ label, href, active }: StatusFilterLinkProps) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md border border-primary bg-primary/10 px-2 py-1 font-medium text-primary"
          : "rounded-md border border-transparent px-2 py-1 text-muted-foreground hover:border-border/60 hover:text-foreground"
      }
    >
      {label}
    </Link>
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

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes <= 1) {
    return "刚刚";
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }
  const days = Math.round(hours / 24);
  return `${days} 天前`;
}
