import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, Rss, PlayCircle, Calendar } from "lucide-react";
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

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function PodcastDetailPage({ params, searchParams }: Props) {
  const { id: idParam } = await params;
  const searchParamsData = await searchParams;
  if (!prisma) {
    return <div>Database not configured</div>;
  }

  const db = prisma as any;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    notFound();
  }

  const podcast = await db.podcast.findUnique({
    where: { id },
    include: {
      episodes: {
        orderBy: { date_published: "desc" },
        take: 50,
        skip: searchParamsData.page ? (parseInt(searchParamsData.page) - 1) * 50 : 0,
      },
      sync_logs: {
        orderBy: { started_at: "desc" },
        take: 5,
      },
    },
  });

  if (!podcast) {
    notFound();
  }

  const totalEpisodes = await db.episode.count({
    where: { podcast_id: id },
  });

  const currentPage = searchParamsData.page ? parseInt(searchParamsData.page) : 1;
  const totalPages = Math.ceil(totalEpisodes / 50);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-6">
            <Card>
              {podcast.artwork || podcast.image ? (
                <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                  <img
                    src={podcast.artwork || podcast.image || ""}
                    alt={podcast.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="text-lg">{podcast.title}</CardTitle>
                {podcast.author ? (
                  <CardDescription>{podcast.author}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {podcast.language ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="uppercase">
                      {podcast.language}
                    </Badge>
                    {podcast.explicit ? (
                      <Badge variant="destructive">Explicit</Badge>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PlayCircle className="h-4 w-4" />
                    <span>{podcast.episode_count || totalEpisodes} 集</span>
                  </div>
                  {podcast.newest_item_pubdate ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        最近更新: {new Date(podcast.newest_item_pubdate).toLocaleDateString()}
                      </span>
                    </div>
                  ) : null}
                </div>

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
                        网站
                      </a>
                    </Button>
                  ) : null}
                  {typeof podcast.podcast_index_id === "number" ? (
                    <SyncPodcastButton feedId={podcast.podcast_index_id} />
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {podcast.sync_logs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">同步历史</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {podcast.sync_logs.map((log: any) => (
                    <div key={log.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.job_type}</span>
                        <Badge
                          variant={
                            log.status === "SUCCESS"
                              ? "success"
                              : log.status === "FAILED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {new Date(log.started_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </aside>

          <main className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>关于这个播客</CardTitle>
              </CardHeader>
              <CardContent>
                {podcast.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
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
                  共 {totalEpisodes} 集节目
                  {totalPages > 1 ? ` · 第 ${currentPage} / ${totalPages} 页` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>节目</TableHead>
                      <TableHead>发布时间</TableHead>
                      <TableHead>时长</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {podcast.episodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-sm">
                          暂无节目
                        </TableCell>
                      </TableRow>
                    ) : (
                        podcast.episodes.map((episode: any) => (
                        <TableRow key={episode.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-start gap-2">
                                <PlayCircle className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                                <div>
                                  <p className="font-medium leading-tight">{episode.title}</p>
                                  {episode.description ? (
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                      {episode.description.replace(/<[^>]*>/g, "")}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              {episode.enclosure_url ? (
                                <a
                                  href={episode.enclosure_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  播放链接
                                </a>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {episode.date_published
                              ? new Date(episode.date_published).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {episode.duration ? formatDuration(episode.duration) : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {currentPage > 1 ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/podcast/${id}?page=${currentPage - 1}`}>上一页</Link>
                      </Button>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      第 {currentPage} / {totalPages} 页
                    </span>
                    {currentPage < totalPages ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/podcast/${id}?page=${currentPage + 1}`}>下一页</Link>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
