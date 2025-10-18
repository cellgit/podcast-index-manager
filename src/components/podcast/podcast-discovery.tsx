"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Flame, Music, SatelliteDish } from "lucide-react";

import { cn } from "@/lib/utils";
import { PodcastFeedList } from "@/components/podcast/podcast-feed-list";
import type { DiscoveryItem } from "@/types/discovery";
import type { DiscoveryImportResult } from "@/components/podcast/discovery-import-button";
import { mapFeedsToDiscoveryItems } from "@/lib/discovery-utils";

type DiscoverySource = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint: string;
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
        if (isMounted) {
          const prepared = mapFeedsToDiscoveryItems(feeds).slice(0, 200);
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

  const handleRefresh = () => {
    setFeedback(null);
    setData((prev) => {
      const next = { ...prev };
      delete next[activeSource.id];
      return next;
    });
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

      <PodcastFeedList
        title={activeSource.label}
        subtitle={
          <span className="text-muted-foreground">
            {activeSource.description} · 共 {items.length} 条候选
          </span>
        }
        items={items}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        feedback={feedback}
        onImportResult={handleImportResult}
      />
    </div>
  );
}
