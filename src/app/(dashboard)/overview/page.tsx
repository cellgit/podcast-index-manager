import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  AlertTriangle,
  Library,
  PlayCircle,
  Plus,
  Radio,
  RefreshCcw,
  Clock3,
} from "lucide-react";
import { SyncStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PodcastSearch } from "@/components/podcast/podcast-search";
import { SyncPodcastButton } from "@/components/podcast/sync-podcast-button";
import { MiniAudioPlayer } from "@/components/podcast/mini-audio-player";
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

const STATUS_META: Record<
  SyncStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "outline" }
> = {
  [SyncStatus.SUCCESS]: { label: "成功", variant: "success" },
  [SyncStatus.FAILED]: { label: "失败", variant: "destructive" },
  [SyncStatus.RUNNING]: { label: "运行中", variant: "warning" },
  [SyncStatus.PENDING]: { label: "排队中", variant: "outline" },
};

export default async function OverviewPage() {
  const db = prisma;
  if (!db) {
    return null;
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    podcasts,
    totalPodcasts,
    latestEpisodes,
    recentLogs,
    totalEpisodeCount,
    episodesLast24h,
    pendingSyncs,
    successesLast24h,
    failuresLast24h,
    qualityAlerts,
  ] = await Promise.all([
    db.podcast.findMany({
      orderBy: { updated_at: "desc" },
      take: 50,
      include: {
        episodes: {
          orderBy: { date_published: "desc" },
          take: 3,
        },
      },
    }),
    db.podcast.count(),
    db.episode.findMany({
      orderBy: { date_published: "desc" },
      take: 50,
      include: {
        podcast: true,
      },
    }),
    db.syncLog.findMany({
      orderBy: { started_at: "desc" },
      take: 20,
      include: {
        podcast: true,
      },
    }),
    db.episode.count(),
    db.episode.count({
      where: {
        date_published: { gte: since24h },
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
        started_at: { gte: since24h },
      },
    }),
    db.syncLog.count({
      where: {
        status: SyncStatus.FAILED,
        started_at: { gte: since24h },
      },
    }),
    db.qualityAlert.findMany({
      where: { status: "open" },
      orderBy: { created_at: "desc" },
      take: 5,
    }),
  ]);

  const trackedFeedIds = podcasts
    .map((podcast) => podcast.podcast_index_id)
    .filter((id): id is number => typeof id === "number");

  const languages = new Set(
    podcasts.map((podcast) => podcast.language?.toUpperCase()).filter(Boolean),
  );
  const averageEpisodes = podcasts.length
    ? Math.round(totalEpisodeCount / podcasts.length)
    : 0;

  const topCatalog = podcasts.slice(0, 6);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">运营仪表盘</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Podcast Index 控制中心
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <a href="/tasks">
              <Activity className="mr-2 h-4 w-4" />
              查看日志
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="/library#import">
              <Plus className="mr-2 h-4 w-4" />
              手动导入
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="已纳入播客"
            value={totalPodcasts}
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
                            <a
                              href={`/podcast/${podcast.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {podcast.title}
                            </a>
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
                          {podcast.episode_count ?? podcast.episodes.length}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {podcast.updated_at ? formatRelativeTime(podcast.updated_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof podcast.podcast_index_id === "number" ? (
                            <SyncPodcastButton feedId={podcast.podcast_index_id} />
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
                          {log.job_type} • {formatRelativeTime(log.started_at)}
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
              <Button variant="outline" size="sm" className="w-full justify-center" asChild>
                <a href="/tasks">查看完整任务历史</a>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section>
          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">质量告警</CardTitle>
              <CardDescription>
                监控增量同步与 Value-for-Value 配置的健康状况。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {qualityAlerts.length === 0 ? (
                <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                  暂无告警，一切正常。
                </div>
              ) : (
                qualityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-md border border-border/60 bg-muted/30 px-3 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{alert.title}</p>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "warning"
                              ? "warning"
                              : "secondary"
                        }
                        className="uppercase"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    {alert.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      创建于：
                      {new Intl.DateTimeFormat("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: false,
                      }).format(alert.created_at)}
                    </p>
                  </div>
                ))
              )}
              <div className="text-right text-xs">
                <a href="/settings" className="text-muted-foreground hover:text-primary">
                  前往系统设置查看告警详情
                </a>
              </div>
            </CardContent>
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
                    <TableHead>试听</TableHead>
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
                        <TableRow key={episode.id} className="align-top">
                          <TableCell className="font-medium text-foreground">
                            <span className="flex items-center gap-2">
                              <PlayCircle className="hidden h-4 w-4 text-primary sm:block" />
                              {episode.title}
                            </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {episode.podcast ? (
                            <a
                              href={`/podcast/${episode.podcast.id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {episode.podcast.title}
                            </a>
                          ) : (
                            "未知"
                          )}
                        </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {episode.date_published ? formatDate(episode.date_published) : "—"}
                          </TableCell>
                          <TableCell className="w-[220px]">
                            {episode.enclosure_url ? (
                              <MiniAudioPlayer
                                src={episode.enclosure_url}
                                type={episode.enclosure_type}
                                title={episode.title}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">无音频文件</span>
                            )}
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
    </>
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
    <Card
      className={
        tone === "warning"
          ? "border-destructive/40 bg-amber-50 dark:bg-amber-950/30"
          : "border-border/70"
      }
    >
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
