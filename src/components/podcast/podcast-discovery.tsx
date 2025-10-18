"use client";

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
  image?: string;
  author?: string;
  language?: string | null;
  medium?: string | null;
  categories: string[];
  newestItemTimestamp?: number | null;
  guid?: string | null;
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
  const [importingKey, setImportingKey] = useState<string | null>(null);
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
          setData((prev) => ({ ...prev, [activeSource.id]: normalized }));
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

  const handleImport = async (item: DiscoveryItem) => {
    const payload =
      item.feedId !== undefined
        ? { feedId: item.feedId }
        : item.guid
          ? { guid: item.guid }
          : item.url
            ? { feedUrl: item.url }
            : null;

    if (!payload) {
      setFeedback("无法提取订阅源的唯一标识符，请手动输入。");
      return;
    }

    setImportingKey(item.key);
    setFeedback(null);
    try {
      const response = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, syncEpisodes: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : `导入失败（${response.status}）`,
        );
      }
      setFeedback(
        typeof result?.podcast?.title === "string"
          ? `已加入《${result.podcast.title}》`
          : "订阅源导入成功",
      );
      router.refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "导入失败");
    } finally {
      setImportingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {SOURCES.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => setActiveSource(source)}
            className={cn(
              "flex items-start gap-3 rounded-md border px-4 py-3 text-left transition-all",
              activeSource.id === source.id
                ? "border-primary bg-primary/10 text-primary shadow"
                : "border-border/60 bg-background hover:border-primary/60",
            )}
          >
            <source.icon className="mt-1 h-5 w-5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">{source.label}</p>
              <p className="text-xs text-muted-foreground">{source.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-md border border-border/60 bg-background p-4">
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
            {items.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-3 rounded-md border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
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
                  </div>
                  {item.author ? (
                    <p className="text-xs text-muted-foreground">作者：{item.author}</p>
                  ) : null}
                  {item.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.categories.length ? (
                    <div className="flex flex-wrap gap-1">
                      {item.categories.slice(0, 4).map((category) => (
                        <Badge key={category} variant="outline" className="text-[10px] font-normal">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-end">
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
                  <Button
                    size="sm"
                    onClick={() => handleImport(item)}
                    disabled={importingKey === item.key}
                  >
                    {importingKey === item.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "加入目录"
                    )}
                  </Button>
                </div>
              </div>
            ))}
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
      ? feed.title
      : typeof (feed as { collectionName?: string }).collectionName === "string"
        ? (feed as { collectionName: string }).collectionName
        : typeof feed.feedTitle === "string"
          ? (feed.feedTitle as string)
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
  const guid =
    (typeof (feed as { podcast_guid?: string }).podcast_guid === "string" &&
      (feed as { podcast_guid: string }).podcast_guid) ||
    (typeof (feed as { podcastGuid?: string }).podcastGuid === "string" &&
      (feed as { podcastGuid: string }).podcastGuid) ||
    null;
  const description =
    (typeof feed.description === "string" && feed.description) ||
    (typeof (feed as { feedDescription?: string }).feedDescription === "string" &&
      (feed as { feedDescription: string }).feedDescription) ||
    undefined;

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

  const author =
    (typeof feed.author === "string" && feed.author) ||
    (typeof (feed as { ownerName?: string }).ownerName === "string" &&
      (feed as { ownerName: string }).ownerName) ||
    (typeof (feed as { feedAuthor?: string }).feedAuthor === "string" &&
      (feed as { feedAuthor: string }).feedAuthor) ||
    undefined;

  const categoriesSource =
    (feed as { categories?: Record<string, string> | string[] }).categories ?? [];
  const categories = Array.isArray(categoriesSource)
    ? categoriesSource.filter((category): category is string => typeof category === "string")
    : typeof categoriesSource === "object" && categoriesSource !== null
      ? Object.values(categoriesSource).filter(
          (category): category is string => typeof category === "string",
        )
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

  const key = guid ?? url ?? (feedId !== undefined ? String(feedId) : title);

  return {
    key,
    feedId,
    title,
    description,
    url,
    image,
    author,
    language,
    medium,
    categories,
    newestItemTimestamp: newestTimestamp,
    guid,
  };
}
