"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PodcastFeedList } from "@/components/podcast/podcast-feed-list";
import type { DiscoveryItem } from "@/types/discovery";
import type { DiscoveryImportResult } from "@/components/podcast/discovery-import-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type FacetEntry = {
  value: string;
  label: string;
  count: number;
};

type FacetGroup = {
  languages: FacetEntry[];
  mediums: FacetEntry[];
  categories: FacetEntry[];
};

type FilterResponse = {
  items: DiscoveryItem[];
  total: number;
  facets: {
    available: FacetGroup;
    filtered: FacetGroup;
  };
  source: string;
};

type ValueMode = "any" | "only" | "exclude";
type ExplicitMode = "include" | "exclude" | "only";
type SourceOption = "recent" | "trending" | "value" | "medium" | "search";
type SortOption = "newest" | "created" | "episodes" | "popularity" | "trend" | "title";

type FilterState = {
  source: SourceOption;
  searchTerm: string;
  language: string;
  medium: string;
  category: string;
  valueMode: ValueMode;
  explicit: ExplicitMode;
  minEpisodes: number;
  sort: SortOption;
  pageSize: number;
};

const DEFAULT_FILTERS: FilterState = {
  source: "search",
  searchTerm: "",
  language: "",
  medium: "",
  category: "",
  valueMode: "any",
  explicit: "include",
  minEpisodes: 0,
  sort: "newest",
  pageSize: 20,
};

const SOURCE_OPTIONS: Array<{ value: SourceOption; label: string }> = [
  { value: "recent", label: "最新入库" },
  { value: "trending", label: "趋势榜" },
  { value: "value", label: "Value-for-Value" },
  { value: "medium", label: "按 Medium 分类" },
  { value: "search", label: "关键词搜索" },
];

const VALUE_OPTIONS: Array<{ value: ValueMode; label: string }> = [
  { value: "any", label: "全部" },
  { value: "only", label: "仅 Value 播客" },
  { value: "exclude", label: "仅非 Value 播客" },
];

const EXPLICIT_OPTIONS: Array<{ value: ExplicitMode; label: string }> = [
  { value: "include", label: "包含全部" },
  { value: "exclude", label: "剔除显式内容" },
  { value: "only", label: "仅显式内容" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "最近更新" },
  { value: "created", label: "首次收录时间" },
  { value: "episodes", label: "节目数量" },
  { value: "popularity", label: "热度" },
  { value: "trend", label: "趋势分" },
  { value: "title", label: "标题字母" },
];

const PAGE_SIZE_OPTIONS = [20, 40, 60, 80];
const FETCH_LIMIT = Number(process.env.NEXT_PUBLIC_PODCAST_INDEX_DISCOVER_LIMIT ?? 80);
const PAGE_SIZE_CHOICES = (() => {
  const filtered = PAGE_SIZE_OPTIONS.filter(
    (value) => value > 0 && value <= FETCH_LIMIT,
  );
  if (filtered.length) {
    return filtered;
  }
  const fallback = Math.max(1, Math.min(FETCH_LIMIT, DEFAULT_FILTERS.pageSize));
  return [fallback];
})();

const EMPTY_FACETS: FacetGroup = {
  languages: [],
  mediums: [],
  categories: [],
};

export function PodcastFilterExplorer({
  initialFilters,
}: {
  initialFilters?: Partial<FilterState>;
}) {
  const router = useRouter();
  const baselineFilters = useMemo(
    () => {
      const merged = { ...DEFAULT_FILTERS, ...(initialFilters ?? {}) };
      const validChoices = new Set(PAGE_SIZE_CHOICES);
      if (!validChoices.has(merged.pageSize)) {
        merged.pageSize = PAGE_SIZE_CHOICES[0];
      }
      return merged;
    },
    [initialFilters],
  );

  const [filters, setFilters] = useState<FilterState>(() => ({ ...baselineFilters }));
  const [searchInput, setSearchInput] = useState(() => baselineFilters.searchTerm);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [availableFacets, setAvailableFacets] = useState<FacetGroup>(EMPTY_FACETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const debouncedFilters = useDebouncedValue(filters, 450);

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("source", debouncedFilters.source);
        params.set("sort", debouncedFilters.sort);
        params.set("limit", String(FETCH_LIMIT));
        if (debouncedFilters.searchTerm) {
          params.set("q", debouncedFilters.searchTerm);
        }
        if (debouncedFilters.language) {
          params.append("language", debouncedFilters.language);
        }
        if (debouncedFilters.medium) {
          params.set("medium", debouncedFilters.medium);
        }
        if (debouncedFilters.category) {
          params.append("category", debouncedFilters.category);
        }
        if (debouncedFilters.valueMode === "only") {
          params.set("valueOnly", "true");
        } else if (debouncedFilters.valueMode === "exclude") {
          params.set("valueOnly", "false");
        }
        if (debouncedFilters.explicit !== "include") {
          params.set("explicit", debouncedFilters.explicit);
        }
        if (debouncedFilters.minEpisodes > 0) {
          params.set("minEpisodes", String(debouncedFilters.minEpisodes));
        }

        const response = await fetch(`/api/podcast/discover/filter?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `请求失败（${response.status}）`);
        }
        const payload = (await response.json()) as FilterResponse;
        if (!isCurrent) {
          return;
        }
        setItems(payload.items);
        setTotal(payload.items.length);
        setAvailableFacets(payload.facets?.available ?? EMPTY_FACETS);
        setLastFetchedAt(new Date());
      } catch (err) {
        if (!isCurrent) {
          return;
        }
        if (isAbortError(err)) {
          return;
        }
        setError(err instanceof Error ? err.message : "加载筛选结果失败");
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      isCurrent = false;
    };
  }, [debouncedFilters]);

  useEffect(() => {
    setFilters((prev) =>
      areFiltersEqual(prev, baselineFilters) ? prev : { ...baselineFilters },
    );
    setSearchInput(baselineFilters.searchTerm);
    setPage(1);
  }, [baselineFilters]);

  const languageOptions = useMemo(() => {
    const entries = availableFacets.languages.map((facet) => ({
      value: facet.value,
      label: `${facet.label} · ${facet.count}`,
    }));
    return [{ value: "", label: "全部语言" }, ...entries];
  }, [availableFacets.languages]);

  const mediumOptions = useMemo(() => {
    const entries = availableFacets.mediums.map((facet) => ({
      value: facet.value,
      label: `${facet.label} · ${facet.count}`,
    }));
    return [{ value: "", label: "全部 Medium" }, ...entries];
  }, [availableFacets.mediums]);

  const categoryOptions = useMemo(() => {
    const entries = availableFacets.categories.map((facet) => ({
      value: facet.value,
      label: `${titleCase(facet.value)} · ${facet.count}`,
    }));
    return [{ value: "", label: "全部分类" }, ...entries];
  }, [availableFacets.categories]);

  const isDirty = useMemo(() => !areFiltersEqual(filters, baselineFilters), [filters, baselineFilters]);

  const subtitle = useMemo(() => {
    if (!items.length) {
      return "暂无结果";
    }
    const pageSize = filters.pageSize;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const parts = [`共 ${total} 条结果`, `第 ${page} / ${totalPages} 页`, `每页 ${pageSize} 条`];
    if (lastFetchedAt) {
      parts.push(`更新于 ${formatTime(lastFetchedAt)}`);
    }
    return parts.join(" · ");
  }, [items.length, total, filters.pageSize, page, lastFetchedAt]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      searchTerm: searchInput.trim(),
    }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ ...baselineFilters });
    setSearchInput(baselineFilters.searchTerm);
    setPage(1);
  };

  const handleImportResult = (result: DiscoveryImportResult) => {
    setFeedback(result.message);
    if (result.success) {
      router.refresh();
    }
  };

  const pageSize = filters.pageSize;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageNumbers = useMemo(
    () => getDisplayedPages(totalPages, currentPage, 7),
    [totalPages, currentPage],
  );

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            新内容筛选
          </CardTitle>
          <CardDescription>
            结合 PodcastIndex 数据，按关键字、语言、Medium、Value 标签等条件筛选潜在节目。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="输入节目名、作者或描述关键字"
                  autoComplete="off"
                />
                <Button type="submit" size="sm" className="shrink-0 gap-1">
                  <Search className="h-3.5 w-3.5" />
                  搜索
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleReset}
                disabled={!isDirty}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重置筛选
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="数据来源">
                <Select
                  value={filters.source}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, source: value as SourceOption };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={SOURCE_OPTIONS}
                />
              </Field>
              <Field label="语言">
                <Select
                  value={filters.language}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, language: value };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={languageOptions}
                />
              </Field>
              <Field label="Medium">
                <Select
                  value={filters.medium}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, medium: value };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={mediumOptions}
                />
              </Field>
              <Field label="分类">
                <Select
                  value={filters.category}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, category: value };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={categoryOptions}
                />
              </Field>
              <Field label="Value 支持">
                <Select
                  value={filters.valueMode}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, valueMode: value as ValueMode };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={VALUE_OPTIONS}
                />
              </Field>
              <Field label="显式内容">
                <Select
                  value={filters.explicit}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, explicit: value as ExplicitMode };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={EXPLICIT_OPTIONS}
                />
              </Field>
              <Field label="最少节目数">
                <Input
                  type="number"
                  min={0}
                  value={filters.minEpisodes}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      minEpisodes: Number(event.target.value),
                    }));
                    setPage(1);
                  }}
                />
              </Field>
              <Field label="排序方式">
                <Select
                  value={filters.sort}
                  onChange={(value) => {
                    setFilters((prev) => {
                      const next = { ...prev, sort: value as SortOption };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={SORT_OPTIONS}
                />
              </Field>
              <Field label="每页显示">
                <Select
                  value={String(filters.pageSize)}
                  onChange={(value) => {
                    const nextSize = Math.max(
                      1,
                      Math.min(Number(value), FETCH_LIMIT),
                    );
                    setFilters((prev) => {
                      const next = { ...prev, pageSize: nextSize };
                      return next;
                    });
                    setPage(1);
                  }}
                  options={PAGE_SIZE_CHOICES.map((option) => ({
                    value: String(option),
                    label: `${option} 条`,
                  }))}
                />
              </Field>
            </div>
          </form>
        </CardContent>
      </Card>

      <PodcastFeedList
        title="筛选结果"
        subtitle={<span className="text-muted-foreground">{subtitle}</span>}
        items={pagedItems}
        loading={loading}
        error={error}
        feedback={feedback}
        onImportResult={handleImportResult}
        emptyMessage="暂无符合条件的播客，请调整筛选条件。"
      />
      {items.length > 0 ? (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
          pageNumbers={pageNumbers}
        />
      ) : null}
    </div>
  );
}

function titleCase(value: string) {
  if (!value) {
    return "";
  }
  return value
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "AbortError";
  }
  return error instanceof Error && error.name === "AbortError";
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function areFiltersEqual(a: FilterState, b: FilterState) {
  return (
    a.source === b.source &&
    a.searchTerm === b.searchTerm &&
    a.language === b.language &&
    a.medium === b.medium &&
    a.category === b.category &&
    a.valueMode === b.valueMode &&
    a.explicit === b.explicit &&
    a.minEpisodes === b.minEpisodes &&
    a.sort === b.sort &&
    a.pageSize === b.pageSize
  );
}

function getDisplayedPages(total: number, current: number, maxLength: number) {
  if (total <= maxLength) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: Array<number | string> = [1];

  const availableSlots = maxLength - 2; // reserve for first & last
  let start = Math.max(2, current - Math.floor(availableSlots / 2));
  const end = Math.min(total - 1, start + availableSlots - 1);

  if (end - start + 1 < availableSlots) {
    start = Math.max(2, end - availableSlots + 1);
  }

  if (start > 2) {
    pages.push("…");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < total - 1) {
    pages.push("…");
  }

  pages.push(total);

  return pages;
}

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
  pageNumbers,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  pageNumbers: Array<number | string>;
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-background/80 px-4 py-3 text-xs text-muted-foreground">
      <span>
        第 {currentPage} / {totalPages} 页
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev || disabled}
        >
          上一页
        </Button>
        {pageNumbers.map((entry, index) =>
          typeof entry === "number" ? (
            <Button
              key={entry}
              type="button"
              variant={entry === currentPage ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => onPageChange(entry)}
              disabled={disabled}
            >
              {entry}
            </Button>
          ) : (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              {entry}
            </span>
          ),
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext || disabled}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
