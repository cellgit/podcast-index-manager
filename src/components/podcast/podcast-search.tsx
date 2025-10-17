"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  ExternalLink,
  Rss,
  Info,
  Globe,
  ArrowDownCircle,
} from "lucide-react";
import type { SearchPodcast } from "@/lib/podcast-index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PodcastSearchProps = {
  trackedFeedIds: number[];
};

type SearchState = {
  status: "idle" | "loading" | "error" | "success";
  message?: string;
};

type ImportState = {
  status: "idle" | "loading" | "error" | "success";
  message?: string;
};

type SearchResponsePayload = {
  feeds?: SearchPodcast[];
  meta?: {
    source?: string;
    message?: string;
  };
};

function normalizeExternalUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function getEpisodeCount(feed: SearchPodcast) {
  return feed.episode_count ?? feed.episodeCount ?? 0;
}

function getNewestPublishTime(feed: SearchPodcast) {
  return feed.newest_item_publish_time ?? feed.newestItemPublishTime ?? null;
}

export function PodcastSearch({ trackedFeedIds }: PodcastSearchProps) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [results, setResults] = useState<SearchPodcast[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" });
  const [importState, setImportState] = useState<ImportState>({ status: "idle" });
  const [trackingIds, setTrackingIds] = useState(new Set(trackedFeedIds));

  const disabled = term.trim().length < 2;
  const importDisabled = feedUrl.trim().length < 8;

  const sortedResults = useMemo(() => {
    return [...results].sort(
      (a, b) => getEpisodeCount(b) - getEpisodeCount(a),
    );
  }, [results]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }
    setSearchState({ status: "loading" });
    try {
      const response = await fetch(
        `/api/podcast/search?term=${encodeURIComponent(term.trim())}`,
      );
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const serverMessage =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : `查找失败（${response.status}）`;
        throw new Error(serverMessage);
      }
      const data = (payload ?? { feeds: [] }) as SearchResponsePayload;
      const feeds = data.feeds ?? [];
      setResults(feeds);
      const successMessage =
        data.meta?.message ?? `在 PodcastIndex 找到 ${feeds.length} 条匹配结果`;
      setSearchState({
        status: "success",
        message: successMessage,
      });
    } catch (error) {
      setSearchState({
        status: "error",
        message:
          error instanceof Error ? error.message : "无法查询 PodcastIndex",
      });
    }
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = feedUrl.trim();
    if (!value || importDisabled) {
      return;
    }
    setImportState({ status: "loading", message: "正在导入订阅源…" });
    try {
      const response = await fetch("/api/podcast/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedUrl: value }),
      });
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const serverMessage =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : `导入失败（${response.status}）`;
        throw new Error(serverMessage);
      }

      const data = (payload ?? {}) as {
        podcast?: {
          id?: number;
          title?: string;
          episodeDelta?: number;
          podcastIndexId?: number | null;
        };
      };

      if (typeof data.podcast?.podcastIndexId === "number") {
        const { podcastIndexId } = data.podcast;
        setTrackingIds((prev) => {
          const next = new Set(prev);
          next.add(podcastIndexId);
          return next;
        });
      }

      setImportState({
        status: "success",
        message:
          data.podcast?.title
            ? `已加入《${data.podcast.title}》，导入 ${
                data.podcast.episodeDelta ?? 0
              } 条节目`
            : "订阅源已导入目录",
      });
      setFeedUrl("");
      router.refresh();
    } catch (error) {
      setImportState({
        status: "error",
        message:
          error instanceof Error ? error.message : "无法导入该订阅源",
      });
    }
  }

  async function handleTrack(feed: SearchPodcast) {
    if (!feed.id || trackingIds.has(feed.id)) {
      return;
    }
    setTrackingIds((prev) => {
      const next = new Set(prev);
      next.add(feed.id);
      return next;
    });
    try {
      const response = await fetch("/api/podcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedId: feed.id }),
      });
      if (!response.ok) {
        throw new Error(`订阅源注册失败（${response.status}）`);
      }
      router.refresh();
    } catch (error) {
      setTrackingIds((prev) => {
        const next = new Set(prev);
        next.delete(feed.id);
        return next;
      });
      setSearchState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "导入订阅源到目录失败",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="按标题、作者或主理人搜索"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="搜索 Podcast 目录"
              className="w-full pl-9"
            />
          </div>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={disabled || searchState.status === "loading"}
          >
            {searchState.status === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在搜索…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                搜索目录
              </span>
            )}
          </Button>
        </form>

        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownCircle className="h-5 w-5 text-primary" />
              按 RSS URL 导入
            </CardTitle>
            <CardDescription>
              既可导入目录，也会触发抓取并同步最新节目。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleImport}>
              <Input
                placeholder="https://example.com/podcast/feed.xml"
                value={feedUrl}
                onChange={(event) => setFeedUrl(event.target.value)}
                aria-label="Podcast RSS Feed URL"
              />
              <Button
                type="submit"
                className="w-full"
                disabled={
                  importDisabled || importState.status === "loading"
                }
              >
                {importState.status === "loading" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在导入…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4" />
                    导入到目录
                  </span>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                支持 PodcastIndex 官方接口，若 RSS 未被收录将自动尝试提交。
              </p>
              {importState.message ? (
                <div
                  className={
                    importState.status === "error"
                      ? "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      : "rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary"
                  }
                >
                  {importState.message}
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>

      {searchState.message ? (
        <div
          className={
            searchState.status === "error"
              ? "rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              : "rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-muted-foreground"
          }
        >
          {searchState.message}
        </div>
      ) : null}

      {sortedResults.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedResults.map((feed) => {
            const episodeCount = getEpisodeCount(feed);
            const newestPublishTime = getNewestPublishTime(feed);
            const websiteUrl = normalizeExternalUrl(
              feed.link ?? feed.originalUrl ?? feed.original_url ?? null,
            );
            const rssUrl = normalizeExternalUrl(feed.url);
            const podcastIndexUrl = `https://podcastindex.org/podcast/${feed.id}`;
            const isTracked = trackingIds.has(feed.id);

            return (
              <Card key={feed.id} className="flex h-full flex-col">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {feed.title}
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                    {feed.author ? <span>{feed.author}</span> : null}
                    {feed.language ? (
                      <Badge variant="secondary" className="uppercase tracking-wide">
                        {feed.language}
                      </Badge>
                    ) : null}
                    <span className="text-muted-foreground">{episodeCount} 集</span>
                    {newestPublishTime ? (
                      <span className="text-muted-foreground">
                        最近更新 {new Date(newestPublishTime * 1000).toLocaleDateString()}
                      </span>
                    ) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                  {feed.description ? (
                    <p className="text-sm text-muted-foreground">
                      {feed.description.slice(0, 220)}
                      {feed.description.length > 220 ? "…" : ""}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无简介。</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={isTracked ? "outline" : "default"}
                        disabled={isTracked}
                        size="sm"
                        onClick={() => handleTrack(feed)}
                      >
                        {isTracked ? "已在目录中" : "加入目录"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        title="在 PodcastIndex.org 打开该播客"
                      >
                        <a href={podcastIndexUrl} target="_blank" rel="noreferrer">
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            PodcastIndex
                          </span>
                        </a>
                      </Button>
                      {websiteUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          title="访问播客官方网站"
                        >
                          <a href={websiteUrl} target="_blank" rel="noreferrer">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              官方网站
                            </span>
                          </a>
                        </Button>
                      ) : null}
                      {rssUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="适用于播客客户端或 RSS 阅读器"
                        >
                          <a href={rssUrl} target="_blank" rel="noreferrer">
                            <span className="flex items-center gap-1">
                              <Rss className="h-3.5 w-3.5" />
                              RSS 源
                            </span>
                          </a>
                        </Button>
                      ) : null}
                    </div>
                    {rssUrl ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Rss className="h-3 w-3 text-primary" />
                        建议在播客客户端或 RSS 阅读器中打开，浏览器直接访问会显示原始 XML。
                      </p>
                    ) : null}
                  </div>
                  {isTracked ? (
                    <div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      <span>已加入目录，可在下方&ldquo;目录概览&rdquo;中查看详情和节目列表</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
