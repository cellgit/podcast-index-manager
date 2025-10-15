import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  AlertTriangle,
  LayoutDashboard,
  Library,
  ListChecks,
  Mic2,
  PlayCircle,
  Plus,
  Radio,
  RefreshCcw,
  Settings,
  Clock3,
} from "lucide-react";
import { SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PodcastSearch } from "@/components/podcast/podcast-search";
import { SyncPodcastButton } from "@/components/podcast/sync-podcast-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

const NAV_ITEMS = [
  { label: "总览", icon: LayoutDashboard, active: true },
  { label: "内容库", icon: Library, active: false },
  { label: "拉取任务", icon: ListChecks, active: false },
  { label: "系统设置", icon: Settings, active: false },
] as const;

const STATUS_META: Record<
  SyncStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "outline" }
> = {
  [SyncStatus.SUCCESS]: { label: "成功", variant: "success" },
  [SyncStatus.FAILED]: { label: "失败", variant: "destructive" },
  [SyncStatus.RUNNING]: { label: "运行中", variant: "warning" },
  [SyncStatus.PENDING]: { label: "排队中", variant: "outline" },
};

export default async function Home() {
  const db = prisma;

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-lg border-dashed border-primary/40">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">需要配置数据库</CardTitle>
            <CardDescription>
              在控制中心加载目录数据前，请先提供 PostgreSQL 连接字符串。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              复制
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code>
              至
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>
              ，并将
              <code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL</code>
              更新为可访问的 PostgreSQL 实例。
            </p>
            <p>
              保存后重启开发服务器，Prisma 会连接数据库并为仪表盘填充播客、节目及同步记录。
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full justify-center">
              查看配置指南
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    podcasts,
    latestEpisodes,
    recentLogs,
    totalEpisodeCount,
    episodesLast24h,
    pendingSyncs,
    successesLast24h,
    failuresLast24h,
  ] = await Promise.all([
    db.podcast.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        episodes: {
          orderBy: { datePublished: "desc" },
          take: 3,
        },
      },
    }),
    db.episode.findMany({
      orderBy: { datePublished: "desc" },
      take: 15,
      include: {
        podcast: true,
      },
    }),
    db.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        podcast: true,
      },
    }),
    db.episode.count(),
    db.episode.count({
      where: {
        datePublished: { gte: since24h },
      },
    }),
    db.syncLog.count({
      where: {
        status: SyncStatus.PENDING,
      },
    }),
    db.syncLog.count({
      where: {
        status: SyncStatus.SUCCESS,
        startedAt: { gte: since24h },
      },
    }),
    db.syncLog.count({
      where: {
        status: SyncStatus.FAILED,
        startedAt: { gte: since24h },
      },
    }),
  ]);

  const trackedFeedIds = podcasts
    .map((podcast) => podcast.podcastIndexId)
    .filter((id): id is number => typeof id === "number");

  const languages = new Set(
    podcasts.map((podcast) => podcast.language?.toUpperCase()).filter(Boolean),
  );
  const averageEpisodes = podcasts.length
    ? Math.round(totalEpisodeCount / podcasts.length)
    : 0;

  const topCatalog = podcasts.slice(0, 6);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-72 flex-col border-r border-border/60 bg-background/80 backdrop-blur lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mic2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">播客运维</p>
            <p className="text-xs text-muted-foreground">抓取控制台</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                item.active
                  ? "flex items-center gap-3 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium shadow"
                  : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-border/60 p-4">
          <Card className="border-dashed border-border/80 bg-muted/40">
            <CardHeader className="space-y-1.5 pb-3">
              <CardTitle className="text-sm font-semibold">自动化状态</CardTitle>
              <CardDescription className="text-xs">
                队列中共有 {pendingSyncs} 个同步任务，请确认 Worker 正常运行以保持内容最新。
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full justify-center">
                查看 Worker 状态
              </Button>
            </CardFooter>
          </Card>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">运营仪表盘</p>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Podcast Index 控制中心</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              <Activity className="mr-2 h-4 w-4" />
              查看日志
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              手动导入
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="已纳入播客"
              value={podcasts.length}
              description={`${languages.size || 0} 种活跃语言`}
              icon={Library}
            />
            <StatCard
              title="已索引节目"
              value={totalEpisodeCount}
              description={`过去 24 小时新增 ${episodesLast24h} 条`}
              icon={Radio}
            />
            <StatCard
              title="已处理同步任务"
              value={successesLast24h}
              description={`${pendingSyncs} 个任务等待执行`}
              icon={RefreshCcw}
            />
            <StatCard
              title="失败告警"
              value={failuresLast24h}
              description="过去 24 小时的自动告警"
              icon={AlertTriangle}
              tone="warning"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">搜索 PodcastIndex</CardTitle>
                <CardDescription>
                  快速检索新的播客源，并一键加入受管目录。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PodcastSearch trackedFeedIds={trackedFeedIds} />
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">运营速览</CardTitle>
                <CardDescription>下一轮抓取前需要关注的关键指标。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/40 px-3 py-3">
                  <RefreshCcw className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">单源平均节目数</p>
                    <p>每个目录播客平均 {averageEpisodes || "–"} 条节目。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/40 px-3 py-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">发布频率</p>
                    <p>过去 24 小时新增 {episodesLast24h} 条节目。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/40 px-3 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">需要关注</p>
                    <p>{failuresLast24h} 个失败同步需要排查。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">目录概览</CardTitle>
                <CardDescription>按活跃度排序的重点播客。</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>播客</TableHead>
                      <TableHead>语言</TableHead>
                      <TableHead>节目数</TableHead>
                      <TableHead className="hidden md:table-cell">最近更新</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCatalog.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-sm">
                          暂无已管理的播客，请从左侧搜索框添加首个订阅源。
                        </TableCell>
                      </TableRow>
                    ) : (
                      topCatalog.map((podcast) => (
                        <TableRow key={podcast.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{podcast.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {podcast.author ?? "未知作者"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {podcast.language ? (
                              <Badge variant="secondary" className="uppercase tracking-wide">
                                {podcast.language}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {podcast.episodeCount ?? podcast.episodes.length}
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                            {formatRelativeTime(podcast.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {typeof podcast.podcastIndexId === "number" ? (
                              <SyncPodcastButton feedId={podcast.podcastIndexId} />
                            ) : (
                              <Badge variant="outline">手动</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">同步动态</CardTitle>
                <CardDescription>最新的抓取任务及其状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentLogs.length === 0 ? (
                  <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                    暂无同步记录，启动首个订阅源以开始监控。
                  </div>
                ) : (
                  recentLogs.map((log) => {
                    const status = STATUS_META[log.status];
                    return (
                      <div
                        key={log.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/40 px-3 py-3 text-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <span>{log.podcast?.title ?? "未关联的订阅源"}</span>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {log.jobType} • {formatRelativeTime(log.startedAt)}
                          </p>
                          {log.message ? (
                            <p className="text-xs text-muted-foreground">{log.message}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full justify-center">
                  查看完整任务历史
                </Button>
              </CardFooter>
            </Card>
          </section>

          <section>
            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">最新节目</CardTitle>
                <CardDescription>
                  实时显示所有已管理播客的最新抓取结果，用于快速抽检。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>节目</TableHead>
                      <TableHead>所属播客</TableHead>
                      <TableHead>发布时间</TableHead>
                      <TableHead>时长</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestEpisodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm">
                          暂无同步到的节目。
                        </TableCell>
                      </TableRow>
                    ) : (
                      latestEpisodes.map((episode) => (
                        <TableRow key={episode.id}>
                          <TableCell className="font-medium text-foreground">
                            <span className="flex items-center gap-2">
                              <PlayCircle className="hidden h-4 w-4 text-primary sm:block" />
                              {episode.title}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {episode.podcast?.title ?? "未知"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {episode.datePublished ? formatDate(episode.datePublished) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDuration(episode.duration)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "default" | "warning";
};

function StatCard({ title, value, description, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <Card className={tone === "warning" ? "border-destructive/40 bg-amber-50 dark:bg-amber-950/30" : "border-border/70"}>
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

function formatDuration(duration?: number | null) {
  if (!duration) {
    return "—";
  }
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (minutes === 0) {
    return `${seconds}秒`;
  }
  if (seconds === 0) {
    return `${minutes}分钟`;
  }
  return `${minutes}分${seconds.toString().padStart(2, "0")}秒`;
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);

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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
}
