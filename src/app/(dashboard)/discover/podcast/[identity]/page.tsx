import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Globe,
  PlayCircle,
  Rss,
} from "lucide-react";

import { createPodcastIndexClient, PodcastIndexRequestError } from "@/lib/podcast-index";
import {
  sanitizeDescriptionHtml,
  sanitizePlainText,
  formatNumber,
} from "@/lib/discovery-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DiscoveryImportButton } from "@/components/podcast/discovery-import-button";
import { MiniAudioPlayer } from "@/components/podcast/mini-audio-player";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  params: Promise<{ identity: string }>;
};

export default async function DiscoverPodcastDetailPage({ params }: Props) {
  const { identity } = await params;
  const decodedIdentity = decodeURIComponent(identity);
  const { type, value } = parseIdentity(decodedIdentity);

  const client = createPodcastIndexClient();

  let feed: Awaited<ReturnType<typeof fetchFeedByIdentity>> | null = null;
  let episodes: Awaited<ReturnType<typeof fetchEpisodes>> = [];
  let errorMessage: string | null = null;

  try {
    feed = await fetchFeedByIdentity(client, type, value);
    if (!feed) {
      errorMessage = "暂时无法从 PodcastIndex 获取该播客详情。";
    }
  } catch (error) {
    console.error("discover detail: fetch feed failed", error);
    errorMessage =
      error instanceof PodcastIndexRequestError
        ? error.message
        : "加载播客详情失败，请稍后再试。";
  }

  if (!feed) {
    return (
      <>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回发现列表
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">播客详情</p>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">信息暂不可用</h1>
          </div>
        </header>
        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-4xl rounded-lg border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
            {errorMessage ?? "暂时无法获取该播客的详细数据，请稍后再试。"}
          </div>
        </main>
      </>
    );
  }

  const feedId = typeof feed.id === "number" ? feed.id : pickNumeric(feed.id) ?? null;

  try {
    episodes = await fetchEpisodes(client, feedId, feed.url);
  } catch (error) {
    console.warn("discover detail: fetch episodes failed", error);
  }

  const categories = feed.categories
    ? Object.values(feed.categories).filter((entry): entry is string => typeof entry === "string")
    : [];
  const newestDate = formatTimestamp(
    pickNumeric(
      feed.newest_item_publish_time,
      feed.newestItemPublishTime,
      feed.newest_item_pubdate,
      feed.newestItemPubdate,
    ),
  );
  const createdDate = formatTimestamp(pickNumeric(feed.created_on, feed.createdOn));
  const lastUpdateDate = formatTimestamp(
    pickNumeric(
      feed.last_update_time,
      feed.lastUpdateTime,
      feed.last_crawl_time,
      feed.lastCrawlTime,
    ),
  );

  const episodeCount = pickNumeric(feed.episode_count, feed.episodeCount);
  const language = feed.language ?? feed.feedLanguage ?? null;
  const medium = feed.medium ?? null;
  const explicit = toBoolean(feed.explicit);
  const website = feed.link ?? feed.original_url ?? feed.originalUrl ?? null;
  const rssUrl = feed.url ?? feed.original_url ?? feed.originalUrl ?? null;
  const funding = feed.funding && (feed.funding.url || feed.funding.message) ? feed.funding : null;
  const valueDestinations = Array.isArray(feed.value?.destinations) ? feed.value?.destinations : [];
  const descriptionHtml = feed.description
    ? sanitizeDescriptionHtml(feed.description, 4_000)
    : null;

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/discover">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回发现列表
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">播客详情</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{feed.title}</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <Card>
              {feed.artwork || feed.image ? (
                <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(feed.artwork ?? feed.image) || ""}
                    alt={feed.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="text-lg">{feed.title}</CardTitle>
                {feed.author ? <CardDescription>{feed.author}</CardDescription> : null}
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  {language ? (
                    <Badge variant="secondary" className="uppercase">
                      {language}
                    </Badge>
                  ) : null}
                  {medium ? (
                    <Badge variant="outline" className="uppercase tracking-wide">
                      {medium}
                    </Badge>
                  ) : null}
                  {explicit ? <Badge variant="destructive">Explicit</Badge> : null}
                  {valueDestinations.length ? (
                    <Badge variant="success" className="text-[10px] uppercase tracking-wide">
                      Value
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-2 text-xs">
                  {episodeCount ? (
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      <span className="text-foreground">合计 {formatNumber(episodeCount)} 集节目</span>
                    </div>
                  ) : null}
                  {newestDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>最近更新 {newestDate}</span>
                    </div>
                  ) : null}
                  {lastUpdateDate ? <p>最后抓取 {lastUpdateDate}</p> : null}
                  {createdDate ? <p>首次收录 {createdDate}</p> : null}
                </div>
                {categories.length ? (
                  <div className="flex flex-wrap gap-1">
                    {categories.map((category) => (
                      <Badge key={category} variant="outline" className="text-[10px]">
                        {category}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  {rssUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={rssUrl} target="_blank" rel="noreferrer">
                        <Rss className="mr-2 h-4 w-4" />
                        RSS Feed
                      </a>
                    </Button>
                  ) : null}
                  {website ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={website} target="_blank" rel="noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        官方网站
                      </a>
                    </Button>
                  ) : null}
                  <DiscoveryImportButton
                    feedId={feedId ?? undefined}
                    guid={feed.podcast_guid ?? feed.podcastGuid}
                    url={rssUrl ?? undefined}
                    showStatus
                    label="加入目录并同步"
                    className="items-stretch"
                  />
                </div>
                {funding ? (
                  <div className="rounded-md border border-amber-200/60 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-400/30 dark:bg-amber-900/20 dark:text-amber-200">
                    <p className="font-medium text-foreground">Funding</p>
                    {funding.message ? <p className="mt-1">{funding.message}</p> : null}
                    {funding.url ? (
                      <a
                        href={funding.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-xs text-primary hover:underline"
                      >
                        {funding.url}
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {valueDestinations.length ? (
                  <div className="rounded-md border border-emerald-200/40 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <p className="font-medium text-foreground">
                      Value-for-Value · {valueDestinations.length} 个地址
                    </p>
                    <ul className="mt-2 space-y-1">
                      {valueDestinations.map((destination, index) => (
                        <li key={`${destination.address}-${index}`} className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {destination.type ?? "node"}
                          </Badge>
                          <span className="break-all">{destination.address}</span>
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
          </aside>

          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>关于这个播客</CardTitle>
                <CardDescription>
                  Feed ID {feedId ?? "—"}
                  {feed.podcast_guid ? ` · GUID ${feed.podcast_guid}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {descriptionHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground [&>p]:my-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">暂无简介</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>节目列表</CardTitle>
                <CardDescription>
                  {episodes.length ? `展示最近 ${episodes.length} 集节目` : "暂无节目信息"}
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
                      <TableHead>媒体类型</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                          暂无节目，稍后再试。
                        </TableCell>
                      </TableRow>
                    ) : (
                      episodes.map((episode) => {
                        const published = formatTimestamp(
                          pickNumeric(episode.date_published, episode.datePublished),
                        );
                        const audioUrl = episode.enclosure_url ?? episode.enclosureUrl ?? undefined;
                        const audioType = episode.enclosure_type ?? episode.enclosureType ?? undefined;
                        const episodeDescription = episode.description
                          ? sanitizePlainText(episode.description)
                          : "";
                        return (
                          <TableRow key={episode.id} className="align-top">
                            <TableCell className="max-w-md">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-foreground">{episode.title}</span>
                                {episodeDescription ? (
                                  <span className="line-clamp-3 text-xs text-muted-foreground">
                                    {episodeDescription}
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{published ?? "—"}</TableCell>
                            <TableCell className="w-[240px]">
                              {audioUrl ? (
                                <MiniAudioPlayer src={audioUrl} type={audioType} title={episode.title} />
                              ) : (
                                <span className="text-xs text-muted-foreground">无音频文件</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDuration(pickNumeric(episode.duration))}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {audioType ?? "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}

function parseIdentity(identity: string): { type: IdentityType; value: string } {
  const [rawType, rawValue] = identity.split(":", 2);
  if (!rawType || !rawValue) {
    notFound();
  }
  const type = rawType as IdentityType;
  if (!IDENTITY_TYPES.includes(type)) {
    notFound();
  }
  const value = type === "guid" || type === "url" ? decodeURIComponent(rawValue) : rawValue;
  return { type, value };
}

type IdentityType = "feed" | "guid" | "url" | "itunes";
const IDENTITY_TYPES: IdentityType[] = ["feed", "guid", "url", "itunes"];

async function fetchFeedByIdentity(
  client: ReturnType<typeof createPodcastIndexClient>,
  type: IdentityType,
  value: string,
) {
  switch (type) {
    case "feed":
      {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? client.podcastByFeedId(numeric) : null;
      }
    case "guid":
      return client.podcastByGuid(value);
    case "url":
      return client.podcastByFeedUrl(value);
    case "itunes":
      {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? client.podcastByItunesId(numeric) : null;
      }
    default:
      return null;
  }
}

async function fetchEpisodes(
  client: ReturnType<typeof createPodcastIndexClient>,
  feedId: number | null,
  feedUrl?: string | null,
) {
  if (feedId) {
    return client.episodesByFeedId(feedId, { max: 30 });
  }
  if (feedUrl) {
    return client.episodesByFeedUrl(feedUrl, { max: 30 });
  }
  return [];
}

function pickNumeric(...values: Array<number | string | null | undefined>): number | null {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  return false;
}

function formatTimestamp(timestamp?: number | null): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }
  const date = timestamp > 10_000_000_000 ? new Date(timestamp) : new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
}

function formatDuration(value?: number | null): string {
  if (!value || !Number.isFinite(value)) {
    return "—";
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  if (minutes === 0) {
    return `${seconds} 秒`;
  }
  if (seconds === 0) {
    return `${minutes} 分钟`;
  }
  return `${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`;
}
