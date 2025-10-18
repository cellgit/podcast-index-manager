import { NextResponse } from "next/server";
import { z } from "zod";

import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";
import { mapFeedsToDiscoveryItems } from "@/lib/discovery-utils";
import type { DiscoveryItem } from "@/types/discovery";

const MAX_FETCH_LIMIT = Number(
  process.env.PODCAST_INDEX_DISCOVER_LIMIT ?? 80,
);
const FILTER_CACHE_TTL_MS = Number(
  process.env.PODCAST_INDEX_FILTER_CACHE_TTL_MS ?? 60_000,
);
const FILTER_CACHE_MAX_ENTRIES = Number(
  process.env.PODCAST_INDEX_FILTER_CACHE_MAX ?? 100,
);

type FilterResponsePayload = {
  items: DiscoveryItem[];
  total: number;
  facets: {
    available: ReturnType<typeof buildFacets>;
    filtered: ReturnType<typeof buildFacets>;
  };
  source: string;
  applied: {
    searchTerm?: string;
    languages: string[];
    medium?: string;
    categories: string[];
    valueOnly?: boolean;
    explicit: ExplicitMode;
    minEpisodes: number;
    sort: string;
  };
};

const responseCache = new Map<string, { expiresAt: number; payload: FilterResponsePayload }>();
const inflightRequests = new Map<string, Promise<FilterResponsePayload>>();

const querySchema = z.object({
  q: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  source: z
    .enum(["recent", "trending", "value", "medium", "search"])
    .optional(),
  medium: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  tag: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  valueOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  explicit: z
    .enum(["include", "exclude", "only"])
    .optional(),
  minEpisodes: z.coerce.number().int().min(0).max(10_000).optional(),
  sort: z
    .enum(["newest", "created", "episodes", "popularity", "trend", "title"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  language: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  languages: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  category: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  categories: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
});

type ExplicitMode = "include" | "exclude" | "only";

export async function GET(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const params = parsed.data;

  const searchTerm = params.q;
  const requestedLimit = params.limit ?? 80;
  const limit = Math.max(
    1,
    Math.min(requestedLimit, MAX_FETCH_LIMIT),
  );
  const mediumFilter = params.medium?.toLowerCase();
  let valueFilter = params.valueOnly ?? undefined;
  if (valueFilter === undefined) {
    const rawValue =
      url.searchParams.get("value") ?? url.searchParams.get("hasValue");
    if (rawValue) {
      const normalized = rawValue.trim().toLowerCase();
      if (["true", "1", "yes", "only"].includes(normalized)) {
        valueFilter = true;
      } else if (["false", "0", "no"].includes(normalized)) {
        valueFilter = false;
      }
    }
  }

  let explicitFilter: ExplicitMode = params.explicit ?? "include";
  if (params.explicit === undefined) {
    const rawExplicit = url.searchParams.get("explicit");
    if (rawExplicit) {
      const normalized = rawExplicit.trim().toLowerCase();
      if (["false", "0", "no", "clean"].includes(normalized)) {
        explicitFilter = "exclude";
      } else if (["true", "1", "yes", "only"].includes(normalized)) {
        explicitFilter = "only";
      }
    }
  }
  const minEpisodes = params.minEpisodes ?? 0;
  const sortKey = params.sort ?? "newest";

  const languageSet = parseMultiValue(url.searchParams, "language");
  if (params.language) {
    languageSet.add(params.language.toLowerCase());
  }
  if (params.languages) {
    for (const lang of splitCommaSeparated(params.languages)) {
      languageSet.add(lang.toLowerCase());
    }
  }

  const categorySet = parseMultiValue(url.searchParams, "category");
  if (params.category) {
    categorySet.add(params.category.toLowerCase());
  }
  if (params.categories) {
    for (const category of splitCommaSeparated(params.categories)) {
      categorySet.add(category.toLowerCase());
    }
  }

  const languageArray = [...languageSet].sort();
  const categoryArray = [...categorySet].sort();

  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);

  const resolvedSource =
    params.source ??
    (searchTerm ? "search" : mediumFilter ? "medium" : "recent");

  const cacheKey = buildCacheKey({
    source: resolvedSource,
    limit,
    searchTerm: searchTerm ?? "",
    medium: mediumFilter ?? "",
    tag: params.tag ?? "",
    valueOnly: valueFilter,
    explicit: explicitFilter,
    minEpisodes,
    sort: sortKey,
    languages: languageArray,
    categories: categoryArray,
  });

  const cachedEntry = responseCache.get(cacheKey);
  const now = Date.now();
  if (cachedEntry && cachedEntry.expiresAt > now) {
    return NextResponse.json(cachedEntry.payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const existingPromise = inflightRequests.get(cacheKey);
  if (existingPromise) {
    const payload = await existingPromise;
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const requestPromise = (async (): Promise<FilterResponsePayload> => {
    const feeds = await resolveFeeds({
      service,
      client,
      source: resolvedSource,
      searchTerm,
      limit,
      medium: mediumFilter,
      tag: params.tag,
      language: languageArray.length === 1 ? languageArray[0] : undefined,
    });

    const normalized = mapFeedsToDiscoveryItems(feeds);
    const availableFacets = buildFacets(normalized);

    const filtered = applyFilters(normalized, {
      searchTerm,
      languages: new Set(languageArray),
      medium: mediumFilter,
      categories: new Set(categoryArray),
      valueOnly: valueFilter,
      explicit: explicitFilter,
      minEpisodes,
    });

    const sorted = sortItems(filtered, sortKey);
    const limited = sorted.slice(0, limit);

    return {
      items: limited,
      total: filtered.length,
      facets: {
        available: availableFacets,
        filtered: buildFacets(filtered),
      },
      source: resolvedSource,
      applied: {
        searchTerm,
        languages: languageArray,
        medium: mediumFilter,
        categories: categoryArray,
        valueOnly: valueFilter,
        explicit: explicitFilter,
        minEpisodes,
        sort: sortKey,
      },
    };
  })();

  inflightRequests.set(cacheKey, requestPromise);

  try {
    const payload = await requestPromise;
    responseCache.set(cacheKey, {
      payload,
      expiresAt: now + FILTER_CACHE_TTL_MS,
    });
    trimCacheIfNeeded();
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function resolveFeeds({
  service,
  client,
  source,
  searchTerm,
  limit,
  medium,
  tag,
  language,
}: {
  service: PodcastService;
  client: ReturnType<typeof createPodcastIndexClient>;
  source: string;
  searchTerm?: string;
  limit: number;
  medium?: string;
  tag?: string;
  language?: string;
}) {
  switch (source) {
    case "search": {
      if (!searchTerm) {
        return [];
      }
      return client.searchPodcasts(searchTerm, limit);
    }
    case "trending": {
      return service.discoverTrending({
        max: limit,
        lang: language,
      });
    }
    case "value": {
      return service.discoverByTag({
        tag: (tag as "podcast-value" | "podcast-valueTimeSplit") ?? "podcast-value",
        max: limit,
      });
    }
    case "medium": {
      if (!medium) {
        return service.discoverRecentFeeds({ max: limit, lang: language });
      }
      return service.discoverByMedium({
        medium,
        max: limit,
      });
    }
    case "recent":
    default: {
      return service.discoverRecentFeeds({
        max: limit,
        lang: language,
      });
    }
  }
}

function applyFilters(
  items: DiscoveryItem[],
  options: {
    searchTerm?: string;
    languages: Set<string>;
    medium?: string;
    categories: Set<string>;
    valueOnly?: boolean;
    explicit: ExplicitMode;
    minEpisodes: number;
  },
) {
  const keyword = options.searchTerm?.toLowerCase();
  const mediumFilter = options.medium?.toLowerCase();

  return items.filter((item) => {
    if (options.languages.size) {
      const language = item.language?.toLowerCase() ?? "";
      if (!language || !options.languages.has(language)) {
        return false;
      }
    }

    if (mediumFilter) {
      const medium = item.medium?.toLowerCase();
      if (!medium || medium !== mediumFilter) {
        return false;
      }
    }

    if (options.categories.size) {
      const categories = item.categories.map((category) => category.toLowerCase());
      if (!categories.some((category) => options.categories.has(category))) {
        return false;
      }
    }

    if (options.valueOnly === true && !item.hasValue) {
      return false;
    }
    if (options.valueOnly === false && item.hasValue) {
      return false;
    }

    if (options.explicit === "exclude" && item.explicit) {
      return false;
    }
    if (options.explicit === "only" && !item.explicit) {
      return false;
    }

    if (options.minEpisodes > 0) {
      const count = item.episodeCount ?? 0;
      if (count < options.minEpisodes) {
        return false;
      }
    }

    if (keyword) {
      const haystack = [item.title, item.description, item.author]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
}

function sortItems(items: DiscoveryItem[], sort: string) {
  const sorted = [...items];
  switch (sort) {
    case "episodes":
      sorted.sort((a, b) => compareNumberDesc(a.episodeCount, b.episodeCount));
      break;
    case "popularity":
      sorted.sort((a, b) => compareNumberDesc(a.popularity, b.popularity));
      break;
    case "trend":
      sorted.sort((a, b) => compareNumberDesc(a.trendScore, b.trendScore));
      break;
    case "created":
      sorted.sort((a, b) => compareNumberDesc(a.createdTimestamp, b.createdTimestamp));
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "zh-CN", { sensitivity: "base" }));
      break;
    case "newest":
    default:
      sorted.sort((a, b) =>
        compareNumberDesc(a.newestItemTimestamp ?? a.lastUpdateTimestamp, b.newestItemTimestamp ?? b.lastUpdateTimestamp),
      );
      break;
  }
  return sorted;
}

function compareNumberDesc(a?: number | null, b?: number | null) {
  const safeA =
    typeof a === "number" && Number.isFinite(a) ? a : Number.NEGATIVE_INFINITY;
  const safeB =
    typeof b === "number" && Number.isFinite(b) ? b : Number.NEGATIVE_INFINITY;
  return safeB - safeA;
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseMultiValue(searchParams: URLSearchParams, key: string) {
  const values = new Set<string>();
  for (const value of searchParams.getAll(key)) {
    for (const entry of splitCommaSeparated(value)) {
      values.add(entry.toLowerCase());
    }
  }
  return values;
}

function buildFacets(items: DiscoveryItem[]) {
  const languageCounts = new Map<string, number>();
  const mediumCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const item of items) {
    if (item.language) {
      const key = item.language.toLowerCase();
      languageCounts.set(key, (languageCounts.get(key) ?? 0) + 1);
    }
    if (item.medium) {
      const key = item.medium.toLowerCase();
      mediumCounts.set(key, (mediumCounts.get(key) ?? 0) + 1);
    }
    for (const category of item.categories) {
      const key = category.toLowerCase();
      categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
    }
  }

  return {
    languages: mapFacet(languageCounts),
    mediums: mapFacet(mediumCounts),
    categories: mapFacet(categoryCounts).slice(0, 30),
  };
}

function mapFacet(source: Map<string, number>) {
  return [...source.entries()]
    .map(([value, count]) => ({
      value,
      label: value.toUpperCase(),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

type CacheKeyInput = {
  source: string;
  limit: number;
  searchTerm: string;
  medium: string;
  tag: string;
  valueOnly?: boolean;
  explicit: ExplicitMode;
  minEpisodes: number;
  sort: string;
  languages: string[];
  categories: string[];
};

function buildCacheKey(input: CacheKeyInput) {
  return JSON.stringify(input);
}

function trimCacheIfNeeded() {
  if (responseCache.size <= FILTER_CACHE_MAX_ENTRIES) {
    return;
  }
  const excess = responseCache.size - FILTER_CACHE_MAX_ENTRIES;
  const keys = responseCache.keys();
  for (let i = 0; i < excess; i += 1) {
    const key = keys.next();
    if (key.done) {
      break;
    }
    responseCache.delete(key.value);
  }
}
