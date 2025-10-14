"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, ExternalLink } from "lucide-react";
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

type SearchResponsePayload = {
  feeds?: SearchPodcast[];
  meta?: {
    source?: string;
    message?: string;
  };
};

export function PodcastSearch({ trackedFeedIds }: PodcastSearchProps) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchPodcast[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" });
  const [trackingIds, setTrackingIds] = useState(new Set(trackedFeedIds));

  const disabled = term.trim().length < 2;

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => (b.episodeCount ?? 0) - (a.episodeCount ?? 0));
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
          {sortedResults.map((feed) => (
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
                  <span className="text-muted-foreground">
                    {feed.episodeCount ?? 0} 集
                  </span>
                  {feed.newestItemPublishTime ? (
                    <span className="text-muted-foreground">
                      最近更新 {new Date(feed.newestItemPublishTime * 1000).toLocaleDateString()}
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={trackingIds.has(feed.id) ? "outline" : "default"}
                    disabled={trackingIds.has(feed.id)}
                    size="sm"
                    onClick={() => handleTrack(feed)}
                  >
                    {trackingIds.has(feed.id) ? "已在目录中" : "加入目录"}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={feed.url} target="_blank" rel="noreferrer">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        打开源链接
                      </span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
