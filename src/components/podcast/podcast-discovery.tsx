"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Flame,
  Music,
  SatelliteDish,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DiscoveryImportButton,
  type DiscoveryImportResult,
} from "@/components/podcast/discovery-import-button";

type DiscoverySource = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint: string;
};

type DiscoveryItem = {
  key: string;
  feedId?: number;
  title: string;
  description?: string;
  url?: string;
  link?: string;
  image?: string;
  author?: string;
  language?: string | null;
  medium?: string | null;
  categories: string[];
  newestItemTimestamp?: number | null;
  guid?: string | null;
  explicit?: boolean | null;
  episodeCount?: number | null;
  itunesId?: number | null;
  lastUpdateTimestamp?: number | null;
  createdTimestamp?: number | null;
  popularity?: number | null;
  trendScore?: number | null;
  priority?: number | null;
  hasValue?: boolean;
  valueDestinationsCount?: number | null;
  valueModelType?: string | null;
  funding?: { url?: string; message?: string } | null;
  detailIdentity?: string | null;
};

type ApiResponse = {
  feeds?: Array<Record<string, unknown>>;
};

const SOURCES: DiscoverySource[] = [
  {
    id: "trending",
    label: "趋势榜",
    description: "PodcastIndex 热度榜单，排除已管理播客。",
    icon: Flame,
    endpoint: "/api/podcast/discover/trending?max=40",
  },
  {
    id: "recent",
    label: "最新入库",
    description: "最近新增到 PodcastIndex 的订阅源，覆盖多语种内容。",
    icon: SatelliteDish,
    endpoint: "/api/podcast/discover/recent?max=40",
  },
  {
    id: "value",
    label: "Value-for-Value",
    description: "支持 Value 标签的播客，适合集成闪电网络与打赏。",
    icon: Compass,
    endpoint: "/api/podcast/discover/by-tag?tag=podcast-value&max=40",
  },
  {
    id: "music",
    label: "音乐播客",
    description: "medium=music 的精选内容，适合音频版权与电台合作。",
    icon: Music,
    endpoint: "/api/podcast/discover/by-medium?medium=music&max=40",
  },
];

export function PodcastDiscovery() {
  const router = useRouter();
  const [activeSource, setActiveSource] = useState<DiscoverySource>(SOURCES[0]);
  const [data, setData] = useState<Record<string, DiscoveryItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (data[activeSource.id]) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(activeSource.endpoint, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`加载失败（${response.status}）`);
        }
        const payload = (await response.json()) as ApiResponse;
        const feeds = Array.isArray(payload.feeds) ? payload.feeds : [];
        const normalized = feeds
          .map(normalizeFeed)
          .filter((item): item is DiscoveryItem => item !== null);
        if (isMounted) {
          const prepared = prepareDiscoveryItems(normalized).slice(0, 200);
          setData((prev) => ({
            ...prev,
            [activeSource.id]: prepared,
          }));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [activeSource, data]);

  const items = useMemo(() => data[activeSource.id] ?? [], [activeSource.id, data]);

  const handleImportResult = (result: DiscoveryImportResult) => {
    setFeedback(result.message);
    if (result.success) {
      router.refresh();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid w-full gap-3 md:grid-cols-2">
        {SOURCES.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => setActiveSource(source)}
            className={cn(
              "flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-all",
              activeSource.id === source.id
                ? "border-primary bg-primary/10 text-primary shadow"
                : "border-border/60 bg-background hover:border-primary/60",
            )}
          >
            <source.icon className="mt-1 h-5 w-5 flex-shrink-0" />
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold break-words">{source.label}</p>
              <p className="text-xs text-muted-foreground break-words">{source.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-full space-y-3 rounded-md border border-border/60 bg-background p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {activeSource.label} · 共 {items.length} 条候选
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setData((prev) => {
                const next = { ...prev };
                delete next[activeSource.id];
                return next;
              })
            }
            className="text-xs"
          >
            <RefreshCcw className="mr-2 h-3.5 w-3.5" />
            刷新
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载…
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-4 text-sm text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
            暂无候选列表，稍后再试或刷新。
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const detailHref = getDetailHref(item);
              const newestLabel = formatTimestamp(item.newestItemTimestamp);
              const lastUpdateLabel = formatTimestamp(item.lastUpdateTimestamp);
              const createdLabel = formatTimestamp(item.createdTimestamp);
              const stats = [
                item.feedId !== undefined
                  ? { key: "feedId", label: "Feed ID", value: String(item.feedId) }
                  : null,
                item.guid
                  ? { key: "guid", label: "GUID", value: item.guid }
                  : null,
                item.itunesId
                  ? { key: "itunes", label: "iTunes ID", value: String(item.itunesId) }
                  : null,
                item.episodeCount !== undefined && item.episodeCount !== null
                  ? {
                      key: "episodes",
                      label: "节目数",
                      value: formatNumber(item.episodeCount),
                    }
                  : null,
                newestLabel
                  ? { key: "newest", label: "最近更新", value: newestLabel }
                  : null,
                lastUpdateLabel
                  ? { key: "lastUpdate", label: "最后抓取", value: lastUpdateLabel }
                  : null,
                createdLabel
                  ? { key: "created", label: "首次收录", value: createdLabel }
                  : null,
                item.popularity !== null && item.popularity !== undefined
                  ? { key: "popularity", label: "热度", value: formatNumber(item.popularity) }
                  : null,
                item.trendScore !== null && item.trendScore !== undefined
                  ? { key: "trend", label: "趋势", value: formatNumber(item.trendScore) }
                  : null,
                item.priority !== null && item.priority !== undefined
                  ? { key: "priority", label: "优先级", value: formatNumber(item.priority) }
                  : null,
                item.valueDestinationsCount
                  ? {
                      key: "value",
                      label: "Value 分成地址",
                      value: String(item.valueDestinationsCount),
                    }
                  : null,
                item.valueModelType
                  ? {
                      key: "valueModel",
                      label: "Value 模式",
                      value: item.valueModelType,
                    }
                  : null,
              ].filter((entry): entry is { key: string; label: string; value: string } => Boolean(entry));

              return (
                <div
                  key={item.key}
                  className="rounded-md border border-border/60 bg-muted/30 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex w-full flex-shrink-0 sm:w-24">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-20 w-20 rounded-md border border-border/50 object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
                          无封面
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {detailHref ? (
                          <Link
                            href={detailHref}
                            className="text-sm font-semibold text-foreground transition hover:text-primary"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        )}
                        {item.medium ? (
                          <Badge variant="outline" className="uppercase tracking-wide">
                            {item.medium}
                          </Badge>
                        ) : null}
                        {item.language ? (
                          <Badge variant="secondary" className="uppercase tracking-wide">
                            {item.language}
                          </Badge>
                        ) : null}
                        {item.hasValue ? (
                          <Badge variant="success" className="text-[10px] uppercase tracking-wide">
                            Value
                          </Badge>
                        ) : null}
                        {item.explicit ? (
                          <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">
                            Explicit
                          </Badge>
                        ) : null}
                      </div>
                      {item.author ? (
                        <p className="text-xs text-muted-foreground">作者：{item.author}</p>
                      ) : null}
                      {item.description ? (
                        <p className="line-clamp-4 break-words text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                      {item.categories.length ? (
                        <div className="flex max-w-full flex-wrap gap-1">
                          {item.categories.slice(0, 6).map((category) => (
                            <Badge key={category} variant="outline" className="text-[10px] font-normal">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {stats.length ? (
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          {stats.map((stat) => (
                            <li key={stat.key} className="flex gap-1">
                              <span>{stat.label}：</span>
                              <span className="break-all text-foreground">{stat.value}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {item.funding?.url ? (
                        <a
                          href={item.funding.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          支持链接：{item.funding.message ?? item.funding.url}
                        </a>
                      ) : null}
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary/80 hover:text-primary hover:underline"
                        >
                          官方网站
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:w-40">
                      {detailHref ? (
                        <Link
                          href={detailHref}
                          className="text-xs text-primary hover:underline"
                        >
                          查看详情
                        </Link>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary hover:underline"
                        >
                          查看 RSS
                        </a>
                      ) : null}
                      <DiscoveryImportButton
                        feedId={item.feedId}
                        guid={item.guid}
                        url={item.url}
                        onResult={handleImportResult}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {feedback ? (
          <p
            className={cn(
              "text-xs",
              feedback.includes("失败") || feedback.includes("无法")
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function normalizeFeed(feed: Record<string, unknown>): DiscoveryItem | null {
  const title =
    typeof feed.title === "string"
      ? sanitizePlainText(feed.title)
      : typeof (feed as { collectionName?: string }).collectionName === "string"
        ? sanitizePlainText((feed as { collectionName: string }).collectionName)
        : typeof feed.feedTitle === "string"
          ? sanitizePlainText(feed.feedTitle as string)
          : null;
  if (!title) {
    return null;
  }

  const feedIdRaw = feed.id ?? (feed as { feedId?: number }).feedId;
  const feedId = typeof feedIdRaw === "number" ? feedIdRaw : undefined;
  const url =
    (typeof feed.url === "string" && feed.url) ||
    (typeof feed.feedUrl === "string" && feed.feedUrl) ||
    (typeof feed.feed_url === "string" && feed.feed_url) ||
    undefined;
  const link =
    (typeof (feed as { link?: string }).link === "string" && (feed as { link: string }).link) ||
    (typeof (feed as { website?: string }).website === "string" &&
      (feed as { website: string }).website) ||
    undefined;
  const guid =
    (typeof (feed as { podcast_guid?: string }).podcast_guid === "string" &&
      (feed as { podcast_guid: string }).podcast_guid) ||
    (typeof (feed as { podcastGuid?: string }).podcastGuid === "string" &&
      (feed as { podcastGuid: string }).podcastGuid) ||
    null;
  const descriptionRaw =
    (typeof feed.description === "string" && feed.description) ||
    (typeof (feed as { feedDescription?: string }).feedDescription === "string" &&
      (feed as { feedDescription: string }).feedDescription) ||
    undefined;
  const description = descriptionRaw
    ? truncateText(sanitizePlainText(descriptionRaw), 480)
    : undefined;

  const image =
    (typeof feed.artwork === "string" && feed.artwork) ||
    (typeof feed.image === "string" && feed.image) ||
    (typeof (feed as { feedImage?: string }).feedImage === "string" &&
      (feed as { feedImage: string }).feedImage) ||
    undefined;

  const language =
    (typeof feed.language === "string" && feed.language) ||
    (typeof (feed as { feedLanguage?: string }).feedLanguage === "string" &&
      (feed as { feedLanguage: string }).feedLanguage) ||
    null;

  const medium =
    (typeof feed.medium === "string" && feed.medium) ||
    (typeof (feed as { podcastMedium?: string }).podcastMedium === "string" &&
      (feed as { podcastMedium: string }).podcastMedium) ||
    null;

  const authorRaw =
    (typeof feed.author === "string" && feed.author) ||
    (typeof (feed as { ownerName?: string }).ownerName === "string" &&
      (feed as { ownerName: string }).ownerName) ||
    (typeof (feed as { feedAuthor?: string }).feedAuthor === "string" &&
      (feed as { feedAuthor: string }).feedAuthor) ||
    undefined;
  const author = authorRaw ? sanitizePlainText(authorRaw) : undefined;

  const categoriesSource =
    (feed as { categories?: Record<string, string> | string[] }).categories ?? [];
  const categories = Array.isArray(categoriesSource)
    ? categoriesSource
        .filter((category): category is string => typeof category === "string")
        .map((category) => sanitizePlainText(category))
        .filter(Boolean)
    : typeof categoriesSource === "object" && categoriesSource !== null
      ? Object.values(categoriesSource)
          .filter((category): category is string => typeof category === "string")
          .map((category) => sanitizePlainText(category))
          .filter(Boolean)
      : [];

  const newestTimestamp =
    (typeof (feed as { newest_item_pubdate?: number }).newest_item_pubdate === "number" &&
      (feed as { newest_item_pubdate: number }).newest_item_pubdate) ||
    (typeof (feed as { newestItemPubdate?: number }).newestItemPubdate === "number" &&
      (feed as { newestItemPubdate: number }).newestItemPubdate) ||
    (typeof (feed as { newest_item_publish_time?: number }).newest_item_publish_time ===
      "number" &&
      (feed as { newest_item_publish_time: number }).newest_item_publish_time) ||
    (typeof (feed as { newestItemPublishTime?: number }).newestItemPublishTime === "number" &&
      (feed as { newestItemPublishTime: number }).newestItemPublishTime) ||
    null;

  const lastUpdateTimestamp =
    pickNumeric(
      (feed as { last_update_time?: number }).last_update_time,
      (feed as { lastUpdateTime?: number }).lastUpdateTime,
      (feed as { valueCreatedOn?: number }).valueCreatedOn,
      (feed as { last_good_http_status_time?: number }).last_good_http_status_time,
      (feed as { lastGoodHttpStatusTime?: number }).lastGoodHttpStatusTime,
    ) ?? null;

  const createdTimestamp =
    pickNumeric(
      (feed as { created_on?: number }).created_on,
      (feed as { createdOn?: number }).createdOn,
    ) ?? null;

  const explicitRaw =
    (feed as { explicit?: boolean | number | string }).explicit ??
    (feed as { itunesExplicit?: boolean | number | string }).itunesExplicit ??
    null;
  const explicit = explicitRaw === null ? null : toBoolean(explicitRaw);

  const episodeCount =
    pickNumeric(
      (feed as { episode_count?: number }).episode_count,
      (feed as { episodeCount?: number }).episodeCount,
    ) ?? null;

  const itunesId =
    pickNumeric(
      (feed as { itunes_id?: number }).itunes_id,
      (feed as { itunesId?: number }).itunesId,
      (feed as { feedItunesId?: number }).feedItunesId,
    ) ?? null;

  const popularity =
    pickNumeric(
      (feed as { popularity?: number }).popularity,
      (feed as { score?: number }).score,
    ) ?? null;

  const trendScore =
    pickNumeric(
      (feed as { trend_score?: number }).trend_score,
      (feed as { trendScore?: number }).trendScore,
    ) ?? null;

  const priority =
    pickNumeric(
      (feed as { priority?: number }).priority,
      (feed as { rank?: number }).rank,
    ) ?? null;

  const fundingSource = (feed as { funding?: { url?: string; message?: string } }).funding;
  const funding =
    fundingSource && (fundingSource.url || fundingSource.message)
      ? {
          url: fundingSource.url,
          message: fundingSource.message ?? undefined,
        }
      : null;

  const valuePayload = (feed as { value?: { destinations?: unknown[]; model?: { type?: string } } }).value;
  const valueDestinationsCount = Array.isArray(valuePayload?.destinations)
    ? valuePayload?.destinations.length ?? null
    : null;
  const valueModelType =
    (valuePayload?.model && typeof valuePayload.model.type === "string"
      ? valuePayload.model.type
      : undefined) ?? null;
  const hasValue =
    Boolean(valueDestinationsCount && valueDestinationsCount > 0) ||
    typeof (feed as { value_block?: string }).value_block === "string" ||
    typeof (feed as { valueBlock?: string }).valueBlock === "string";

  const detailIdentity = buildDetailIdentity({
    feedId,
    guid,
    url,
    itunesId,
  });

  const key = guid ?? url ?? (feedId !== undefined ? String(feedId) : title);

  return {
    key,
    feedId,
    title,
    description,
    url,
    link,
    image,
    author,
    language,
    medium,
    categories,
    newestItemTimestamp: newestTimestamp,
    guid,
    explicit,
    episodeCount,
    itunesId,
    lastUpdateTimestamp,
    createdTimestamp,
    popularity,
    trendScore,
    priority,
    hasValue,
    valueDestinationsCount,
    valueModelType,
    funding,
    detailIdentity,
  };
}

function prepareDiscoveryItems(items: DiscoveryItem[]): DiscoveryItem[] {
  const identityIndex = new Map<string, number>();
  const keyCounter = new Map<string, number>();
  const result: DiscoveryItem[] = [];

  items.forEach((item) => {
    const identity = getItemIdentity(item);
    if (identity && identityIndex.has(identity)) {
      const existingIndex = identityIndex.get(identity)!;
      const preferred = pickPreferredItem(result[existingIndex], item);
      const existingKey = result[existingIndex].key;
      result[existingIndex] =
        preferred.key === existingKey ? preferred : { ...preferred, key: existingKey };
      return;
    }

    const duplicates = keyCounter.get(item.key) ?? 0;
    keyCounter.set(item.key, duplicates + 1);
    const nextItem =
      duplicates === 0 ? item : { ...item, key: `${item.key}::${duplicates}` };
    result.push(nextItem);

    if (identity) {
      identityIndex.set(identity, result.length - 1);
    }
  });

  return result;
}

function getItemIdentity(item: DiscoveryItem): string | null {
  if (item.guid) {
    return `guid:${item.guid}`;
  }
  if (item.url) {
    return `url:${item.url.toLowerCase()}`;
  }
  if (item.feedId !== undefined) {
    return `feed:${item.feedId}`;
  }
  return null;
}

function pickPreferredItem(current: DiscoveryItem, candidate: DiscoveryItem): DiscoveryItem {
  return scoreCandidate(candidate) > scoreCandidate(current) ? candidate : current;
}

function scoreCandidate(item: DiscoveryItem): number {
  let score = 0;
  if (item.feedId !== undefined) {
    score += 8;
  }
  if (item.guid) {
    score += 4;
  }
  if (item.url) {
    score += 2;
  }
  if (item.description) {
    score += 1;
  }
  if (item.categories.length) {
    score += 1;
  }
  if (item.image) {
    score += 1;
  }
  if (item.hasValue) {
    score += 1;
  }
  if (item.episodeCount) {
    score += 1;
  }
  return score;
}

function pickNumeric(
  ...values: Array<number | string | null | undefined>
): number | null {
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

function toBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
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
  return null;
}

function formatTimestamp(timestamp?: number | null): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }
  const date =
    timestamp > 10_000_000_000 ? new Date(timestamp) : new Date(timestamp * 1000);
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

function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("zh-CN").format(value);
}

function buildDetailIdentity({
  feedId,
  guid,
  url,
  itunesId,
}: {
  feedId?: number;
  guid?: string | null;
  url?: string;
  itunesId?: number | null;
}): string | null {
  if (feedId !== undefined) {
    return `feed:${feedId}`;
  }
  if (guid) {
    return `guid:${encodeURIComponent(guid)}`;
  }
  if (itunesId) {
    return `itunes:${itunesId}`;
  }
  if (url) {
    return `url:${encodeURIComponent(url)}`;
  }
  return null;
}

function getDetailHref(item: DiscoveryItem): string | null {
  if (!item.detailIdentity) {
    return null;
  }
  return `/discover/podcast/${encodeURIComponent(item.detailIdentity)}`;
}

function sanitizePlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trimEnd()}...`;
}
