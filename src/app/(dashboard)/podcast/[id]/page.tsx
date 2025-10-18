import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Rss,
  PlayCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
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
import { SyncPodcastButton } from "@/components/podcast/sync-podcast-button";
import { MiniAudioPlayer } from "@/components/podcast/mini-audio-player";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function PodcastDetailPage({ params, searchParams }: Props) {
  if (!prisma) {
    notFound();
  }

  const { id: idParam } = await params;
  const searchParamsData = await searchParams;
  const db = prisma;

  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    notFound();
  }

  const podcast = await db.podcast.findUnique({
    where: { id },
    include: {
      episodes: {
        orderBy: { date_published: "desc" },
        take: 50,
        skip: searchParamsData.page ? (Number.parseInt(searchParamsData.page) - 1) * 50 : 0,
      },
      sync_logs: {
        orderBy: { started_at: "desc" },
        take: 5,
      },
      value_destinations: true,
      categories: {
        include: { category: true },
      },
    },
  });

  if (!podcast) {
    notFound();
  }

  const totalEpisodes = await db.episode.count({
    where: { podcast_id: id },
  });

  const currentPage = searchParamsData.page ? Number.parseInt(searchParamsData.page) : 1;
  const totalPages = Math.max(1, Math.ceil(totalEpisodes / 50));

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/library">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回内容库
          </Link>
        </Button>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">播客详情</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{podcast.title}</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <Card>
              {podcast.artwork || podcast.image ? (
                <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(podcast.artwork ?? podcast.image) || ""}
                    alt={podcast.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="text-lg">{podcast.title}</CardTitle>
                {podcast.author ? <CardDescription>{podcast.author}</CardDescription> : null}
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  {podcast.language ? (
                    <Badge variant="secondary" className="uppercase">
                      {podcast.language}
                    </Badge>
                  ) : null}
                  {podcast.medium ? (
                    <Badge variant="outline" className="uppercase tracking-wide">
                      {podcast.medium}
                    </Badge>
                  ) : null}
                  {podcast.explicit ? <Badge variant="destructive">Explicit</Badge> : null}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    <span className="text-foreground">
                      合计 {podcast.episode_count ?? totalEpisodes} 集节目
                    </span>
                  </div>
                  {podcast.newest_item_pubdate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-muted-foreground">
                        最近更新{" "}
                        {new Intl.DateTimeFormat("zh-CN", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }).format(podcast.newest_item_pubdate)}
                      </span>
                    </div>
                  ) : null}
                </div>
                {podcast.categories.length ? (
                  <div className="flex flex-wrap gap-1">
                    {podcast.categories.map((item) => (
                      <Badge key={item.category_id} variant="outline" className="text-[10px]">
                        {item.category.name}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  {podcast.url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={podcast.url} target="_blank" rel="noreferrer">
                        <Rss className="mr-2 h-4 w-4" />
                        RSS Feed
                      </a>
                    </Button>
                  ) : null}
                  {podcast.link ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={podcast.link} target="_blank" rel="noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        官方网站
                      </a>
                    </Button>
                  ) : null}
                  {typeof podcast.podcast_index_id === "number" ? (
                    <SyncPodcastButton feedId={podcast.podcast_index_id} />
                  ) : null}
                  {podcast.podcast_guid ? (
                    <Button variant="ghost" size="sm" className="justify-start text-xs" asChild>
                      <a
                        href={`https://podcastindex.social/@PodcastIndex/${podcast.podcast_guid}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Podcast GUID: {podcast.podcast_guid}
                      </a>
                    </Button>
                  ) : null}
                </div>
                {podcast.value_destinations.length ? (
                  <div className="rounded-md border border-emerald-200/40 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <p className="font-medium text-foreground">Value-for-Value</p>
                    <ul className="mt-2 space-y-1">
                      {podcast.value_destinations.map((destination) => (
                        <li key={destination.id} className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {destination.type ?? "node"}
                          </Badge>
                          <span>{destination.address}</span>
                          {destination.split ? (
                            <span className="text-muted-foreground">分成 {destination.split}%</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {podcast.sync_logs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">同步历史</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  {podcast.sync_logs.map((log) => (
                    <div key={log.id} className="rounded-md border border-border/60 px-3 py-2">
                      <div className="flex items-center justify-between text-foreground">
                        <span>{log.job_type}</span>
                        <Badge
                          variant={
                            log.status === "SUCCESS"
                              ? "success"
                              : log.status === "FAILED"
                                ? "destructive"
                                : "outline"
                          }
                          className="text-[10px]"
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <p className="mt-1">
                        {new Intl.DateTimeFormat("zh-CN", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          hour12: false,
                        }).format(log.started_at)}
                      </p>
                      {log.message ? <p className="mt-1">{log.message}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </aside>

          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>关于这个播客</CardTitle>
              </CardHeader>
              <CardContent>
                {podcast.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {podcast.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无简介</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>节目列表</CardTitle>
                <CardDescription>
                  共 {totalEpisodes} 集节目{totalPages > 1 ? ` · 第 ${currentPage}/${totalPages} 页` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>发布时间</TableHead>
                    <TableHead>试听</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>媒体</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {podcast.episodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                          暂无节目，尝试手动同步或稍后再试。
                        </TableCell>
                      </TableRow>
                    ) : (
                      podcast.episodes.map((episode) => (
                        <TableRow key={episode.id} className="align-top">
                          <TableCell className="max-w-md text-sm font-medium text-foreground">
                            <div className="flex flex-col">
                              <span>{episode.title}</span>
                              {episode.description ? (
                                <span className="line-clamp-2 text-xs text-muted-foreground">
                                  {episode.description}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {episode.date_published
                              ? new Intl.DateTimeFormat("zh-CN", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "numeric",
                                }).format(episode.date_published)
                              : "—"}
                          </TableCell>
                          <TableCell className="w-[240px]">
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
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDuration(episode.duration)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {episode.enclosure_type ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  第 {currentPage} / {totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    asChild
                  >
                    <Link href={`/podcast/${podcast.id}?page=${currentPage - 1}`}>上一页</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    asChild
                  >
                    <Link href={`/podcast/${podcast.id}?page=${currentPage + 1}`}>下一页</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}

function formatDuration(duration?: number | null) {
  if (!duration) {
    return "—";
  }
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (minutes === 0) {
    return `${seconds} 秒`;
  }
  if (seconds === 0) {
    return `${minutes} 分钟`;
  }
  return `${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`;
}
