"use client";

import Link from "next/link";
import { Loader2, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatNumber,
  formatTimestamp,
  getDetailHref,
} from "@/lib/discovery-utils";
import type { DiscoveryItem } from "@/types/discovery";
import {
  DiscoveryImportButton,
  type DiscoveryImportResult,
} from "@/components/podcast/discovery-import-button";

type PodcastFeedListProps = {
  title?: string;
  subtitle?: ReactNode;
  items: DiscoveryItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  feedback?: string | null;
  emptyMessage?: string;
  onImportResult: (result: DiscoveryImportResult) => void;
};

const FALLBACK_EMPTY = "暂无候选列表，稍后再试或更新筛选条件。";

export function PodcastFeedList({
  title,
  subtitle,
  items,
  loading = false,
  error = null,
  onRefresh,
  feedback,
  emptyMessage = FALLBACK_EMPTY,
  onImportResult,
}: PodcastFeedListProps) {
  const resolvedTitle = title ?? "候选播客";
  const resolvedSubtitle =
    subtitle ?? (
      <span className="text-muted-foreground">
        共 {items.length} 条候选
      </span>
    );

  return (
    <section className="space-y-3 rounded-lg border border-border/60 bg-background/95 p-5 shadow-sm">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
          <p className="text-xs">{resolvedSubtitle}</p>
        </div>
        {onRefresh ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="ml-auto gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            刷新数据
          </Button>
        ) : null}
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在加载候选内容…
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <PodcastFeedListItem
              key={item.key}
              item={item}
              onImportResult={onImportResult}
            />
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
    </section>
  );
}

type PodcastFeedListItemProps = {
  item: DiscoveryItem;
  onImportResult: (result: DiscoveryImportResult) => void;
};

function PodcastFeedListItem({ item, onImportResult }: PodcastFeedListItemProps) {
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
    typeof item.episodeCount === "number"
      ? { key: "episodes", label: "节目数", value: formatNumber(item.episodeCount) }
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
    typeof item.popularity === "number"
      ? { key: "popularity", label: "热度", value: formatNumber(item.popularity) }
      : null,
    typeof item.trendScore === "number"
      ? { key: "trend", label: "趋势", value: formatNumber(item.trendScore) }
      : null,
    typeof item.priority === "number"
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
  ].filter(
    (entry): entry is { key: string; label: string; value: string } => Boolean(entry),
  );

  return (
    <article className="group grid gap-5 rounded-lg border border-border/50 bg-muted/20 p-4 shadow-sm transition hover:border-primary/50 hover:bg-background/80 hover:shadow-md sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-6 sm:items-start">
      <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-md border border-border/60 bg-muted shadow-sm sm:mx-0 sm:self-start">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            无封面
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 pt-3 sm:pt-1">
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
          {typeof item.episodeCount === "number" ? (
            <span className="text-[11px] text-muted-foreground">
              共 {formatNumber(item.episodeCount)} 集
            </span>
          ) : null}
        </div>

        {item.author ? (
          <p className="text-xs text-muted-foreground">作者：{item.author}</p>
        ) : null}

        {item.descriptionHtml ? (
          <div
            className="space-y-1 text-xs leading-5 text-muted-foreground [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:m-0 [&>ul]:list-disc [&>ul]:pl-4 [&>a]:text-primary hover:[&>a]:underline"
            dangerouslySetInnerHTML={{ __html: item.descriptionHtml }}
          />
        ) : item.description ? (
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
          <dl className="grid gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.key} className="flex gap-1">
                <dt>{stat.label}：</dt>
                <dd className="break-all text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>
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

      <div className="flex flex-col items-end gap-2 sm:w-40 sm:self-start">
        {detailHref ? (
          <Link href={detailHref} className="text-xs text-primary hover:underline">
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
          guid={item.guid ?? undefined}
          url={item.url}
          onResult={onImportResult}
        />
      </div>
    </article>
  );
}
