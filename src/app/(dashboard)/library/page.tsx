import { Prisma, SyncStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Filter, Wallet, RefreshCcw, FolderPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { PodcastImportPanel } from "@/components/podcast/podcast-import-panel";
import { SyncPodcastButton } from "@/components/podcast/sync-podcast-button";
import { CollectionQuickAction } from "@/components/podcast/collection-quick-action";
import { CollectionCreateForm } from "@/components/podcast/collection-create-form";
import { PodcastLibraryActions } from "@/components/podcast/podcast-library-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type LibraryPageProps = {
  searchParams: Promise<{
    q?: string;
    medium?: string;
    value?: "all" | "with" | "without";
  }>;
};

const DEFAULT_TAKE = 100;

const EDITORIAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "正常",
  PAUSED: "暂停",
  ARCHIVED: "归档",
};

const EDITORIAL_PRIORITY_LABELS: Record<string, string> = {
  HIGH: "高优",
  NORMAL: "普通",
  LOW: "低优",
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  if (!prisma) {
    notFound();
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const mediumFilter = (params.medium ?? "all").trim();
  const valueFilter = params.value ?? "all";

  const where: Prisma.PodcastWhereInput = {};
  const andConditions: Prisma.PodcastWhereInput[] = [];

  if (query) {
    andConditions.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { podcast_guid: { equals: query } },
        { url: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (mediumFilter && mediumFilter !== "all") {
    andConditions.push({ medium: mediumFilter });
  }

  if (valueFilter === "with") {
    andConditions.push({ value_destinations: { some: {} } });
  } else if (valueFilter === "without") {
    andConditions.push({
      value_destinations: { none: {} },
      value_model_type: null,
      value_block: null,
    });
  }

  if (andConditions.length) {
    where.AND = andConditions;
  }

  const [podcasts, total, overallTotal, mediumStats, valueEnabledCount, collections] = await Promise.all([
    prisma.podcast.findMany({
      where,
      orderBy: { updated_at: "desc" },
      take: DEFAULT_TAKE,
      include: {
        categories: {
          include: { category: true },
        },
        value_destinations: true,
        episodes: {
          orderBy: { date_published: "desc" },
          take: 1,
        },
        editorial: true,
      },
    }),
    prisma.podcast.count({ where }),
    prisma.podcast.count(),
    prisma.podcast.groupBy({
      by: ["medium"],
      _count: { _all: true },
    }),
    prisma.podcast.count({
      where: {
        value_destinations: { some: {} },
      },
    }),
    prisma.podcastCollection.findMany({
      orderBy: { updated_at: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    }),
  ]);

  const mediums = mediumStats
    .map((entry) => ({
      medium: entry.medium ?? "未分类",
      count: entry._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const podcastIds = podcasts.map((podcast) => podcast.id);
  const pendingCounts = podcastIds.length
    ? await prisma.syncLog.groupBy({
        by: ["podcast_id"],
        _count: { _all: true },
        where: {
          podcast_id: { in: podcastIds },
          status: SyncStatus.PENDING,
        },
      })
    : [];

  const pendingMap = new Map<number, number>();
  pendingCounts.forEach((entry) => {
    if (entry.podcast_id) {
      pendingMap.set(entry.podcast_id, entry._count._all);
    }
  });

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">目录管理</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">内容库</h1>
        </div>
        <form className="ml-auto flex w-full max-w-md items-center gap-2" action="/library">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="按标题、作者、GUID 或 RSS 地址搜索"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <Button type="submit" variant="secondary">
            搜索
          </Button>
        </form>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">
                已管理的播客{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  （共 {total} 条 / 全库 {overallTotal} 条）
                </span>
              </CardTitle>
              <CardDescription>
                根据筛选条件展示目录中的重点播客，支持快速进入详情页与即时同步。
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>筛选：</span>
                <form className="flex items-center gap-2" action="/library" method="get">
                  <input type="hidden" name="q" value={query} />
                  <select
                    name="medium"
                    defaultValue={mediumFilter}
                    className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  >
                    <option value="all">全部媒介</option>
                    {mediums.map((item) => (
                      <option key={item.medium} value={item.medium === "未分类" ? "" : item.medium}>
                        {item.medium}（{item.count}）
                      </option>
                    ))}
                  </select>
                  <select
                    name="value"
                    defaultValue={valueFilter}
                    className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  >
                    <option value="all">所有订阅源</option>
                    <option value="with">仅 Value for Value</option>
                    <option value="without">不含 Value for Value</option>
                  </select>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    应用
                  </Button>
                </form>
                <a href="/library" className="text-xs hover:text-primary hover:underline">
                  清除筛选
                </a>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>播客</TableHead>
                    <TableHead>媒介</TableHead>
                    <TableHead>语言</TableHead>
                    <TableHead>节目数</TableHead>
                    <TableHead>最新节目</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {podcasts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                        暂无符合条件的播客，请调整筛选或从右侧导入新订阅源。
                      </TableCell>
                    </TableRow>
                  ) : (
                    podcasts.map((podcast) => {
                      const latestEpisode = podcast.episodes[0];
                      const pending = pendingMap.get(podcast.id) ?? 0;
                      const hasValue =
                        podcast.value_destinations.length > 0 ||
                        Boolean(podcast.value_model_type || podcast.value_block);
                      const editorial = podcast.editorial;
                      const displayTitle = editorial?.display_title ?? podcast.title;
                      const displayAuthor = editorial?.display_author ?? podcast.author ?? "未知作者";
                      const statusLabel = editorial ? EDITORIAL_STATUS_LABELS[editorial.status] ?? editorial.status : null;
                      const priorityLabel = editorial ? EDITORIAL_PRIORITY_LABELS[editorial.priority] ?? editorial.priority : null;
                      const editorialTags = editorial?.tags ?? [];

                      return (
                        <TableRow key={podcast.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/podcast/${podcast.id}`}
                                className="font-medium text-foreground hover:text-primary hover:underline"
                              >
                                {displayTitle}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {displayAuthor}
                              </span>
                              {podcast.categories.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {podcast.categories.slice(0, 3).map((item) => (
                                    <Badge key={item.category_id} variant="outline" className="text-[10px] font-normal">
                                      {item.category.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                              {editorial ? (
                                <div className="flex flex-wrap items-center gap-1">
                                  {statusLabel ? (
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                      {statusLabel}
                                    </Badge>
                                  ) : null}
                                  {priorityLabel ? (
                                    <Badge
                                      variant={editorial.priority === "HIGH" ? "destructive" : editorial.priority === "LOW" ? "secondary" : "outline"}
                                      className="text-[10px] uppercase"
                                    >
                                      {priorityLabel}
                                    </Badge>
                                  ) : null}
                                  {editorialTags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-[10px]">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {podcast.medium ? (
                              <Badge variant="secondary" className="uppercase tracking-wide">
                                {podcast.medium}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">未分类</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {podcast.language ? (
                              <Badge variant="outline" className="uppercase tracking-wide">
                                {podcast.language}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{podcast.episode_count ?? podcast.episodes.length}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {latestEpisode?.date_published
                              ? new Intl.DateTimeFormat("zh-CN", {
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "numeric",
                                  hour12: false,
                                }).format(latestEpisode.date_published)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {hasValue ? (
                              <Badge variant="success" className="gap-1 text-[10px]">
                                <Wallet className="h-3 w-3" />
                                已配置
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                未启用
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/podcast/${podcast.id}`}>查看详情</Link>
                              </Button>
                              {typeof podcast.podcast_index_id === "number" ? (
                                <SyncPodcastButton feedId={podcast.podcast_index_id} />
                              ) : (
                                <span className="text-xs text-muted-foreground">手动维护</span>
                              )}
                              {pending > 0 ? (
                                <span className="text-[10px] text-muted-foreground">
                                  队列中 {pending} 项未完成
                                </span>
                              ) : null}
                              <CollectionQuickAction
                                podcastId={podcast.id}
                                collections={collections.map((collection) => ({
                                  id: collection.id,
                                  name: collection.name,
                                  description: collection.description,
                                }))}
                              />
                              <PodcastLibraryActions
                                podcastId={podcast.id}
                                editorial={editorial ? {
                                  display_title: editorial.display_title,
                                  display_author: editorial.display_author,
                                  display_image: editorial.display_image,
                                  status: editorial.status,
                                  priority: editorial.priority,
                                  tags: editorial.tags,
                                  notes: editorial.notes,
                                } : null}
                                defaults={{
                                  title: podcast.title,
                                  author: podcast.author ?? null,
                                  image: podcast.artwork ?? podcast.image ?? null,
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">目录概览</CardTitle>
                <CardDescription>
                  当前 {overallTotal} 个播客中，{valueEnabledCount} 个启用了 Value-for-Value。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {mediums.length === 0 ? (
                  <p className="text-xs text-muted-foreground">暂无数据</p>
                ) : (
                  mediums.slice(0, 6).map((item) => (
                    <div key={item.medium} className="flex items-center justify-between">
                      <span>{item.medium}</span>
                      <span className="font-medium text-foreground">{item.count}</span>
                    </div>
                  ))
                )}
                {podcasts.length >= DEFAULT_TAKE ? (
                  <p className="text-xs">仅展示最近 {DEFAULT_TAKE} 条，可使用筛选进一步缩小范围。</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">快速导入</CardTitle>
                <CardDescription>
                  支持通过 RSS、Feed ID、GUID 或 iTunes ID 添加到目录。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PodcastImportPanel />
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderPlus className="h-4 w-4" /> 收藏集
                </CardTitle>
                <CardDescription>
                  将重点播客整理成运营集合，方便后续批量操作。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <CollectionCreateForm />
                <div className="space-y-2">
                  {collections.length === 0 ? (
                    <p className="text-xs">尚无收藏集，先创建一个吧。</p>
                  ) : (
                    collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{collection.name}</p>
                          {collection.description ? (
                            <p>{collection.description}</p>
                          ) : null}
                        </div>
                        <Badge variant="outline">{collection._count.items} 条</Badge>
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
