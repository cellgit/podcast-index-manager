// src/lib/net-bootstrap.ts（建议新建一个文件，尽早 import）
import dns from "node:dns";
import { setGlobalDispatcher, Agent, ProxyAgent } from "undici";

const bootstrapState = globalThis as {
  __podcastIndexBootstrap?: boolean;
};

if (!bootstrapState.__podcastIndexBootstrap) {
  // 1) 让 Node 解析时优先 IPv4（等价于 curl 的 -4）
  dns.setDefaultResultOrder("ipv4first");

  // 2) 若存在显式代理，则用 ProxyAgent；否则用直连 Agent。
  //    这能保证 VSCode 里运行的 Node 进程与浏览器看到的“通路”一致。
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const agent = httpsProxy
    ? new ProxyAgent(httpsProxy)
    : new Agent({
        keepAliveTimeout: 60_000,
        connect: {
          timeout: 15_000, // 连接超时（毫秒）
          family: 4, // 强制 IPv4，避免走 IPv6 黑洞
        },
      });

  setGlobalDispatcher(agent);

  // 3) 可选：白名单直连该域名（即使系统/进程设了代理）
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || "";
  if (!/(^|,)\s*api\.podcastindex\.org\s*(,|$)/i.test(noProxy)) {
    process.env.NO_PROXY = [noProxy, "api.podcastindex.org"].filter(Boolean).join(",");
  }

  bootstrapState.__podcastIndexBootstrap = true;
}



import { createHash } from "node:crypto";
// https://api.podcastindex.org/api/1.0/search/byterm?q=batman+university&pretty
const API_BASE = "https://api.podcastindex.org/api/1.0" as const;
const RATE_LIMIT_INTERVAL_MS = Number(
  process.env.PODCAST_INDEX_MIN_INTERVAL_MS ?? 1_200,
);
const MAX_RETRIES = Number(process.env.PODCAST_INDEX_MAX_RETRIES ?? 3);
const RETRY_BASE_DELAY_MS = Number(
  process.env.PODCAST_INDEX_RETRY_BASE_MS ?? 1_500,
);
const MAX_RETRY_WAIT_MS = Number(
  process.env.PODCAST_INDEX_MAX_RETRY_WAIT_MS ?? 10_000,
);

const rateLimiter = createRateLimiter(RATE_LIMIT_INTERVAL_MS);

export class PodcastIndexRequestError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PodcastIndexRequestError";
  }
}

export type PodcastIndexCredentials = {
  apiKey: string;
  apiSecret: string;
  userAgent: string;
};

export type SearchPodcast = {
  id: number;
  title: string;
  author?: string;
  description?: string;
  url: string;
  link?: string;
  original_url?: string;
  originalUrl?: string;
  image?: string;
  artwork?: string;
  podcast_guid?: string;
  newest_item_publish_time?: number;
  newestItemPublishTime?: number;
  episode_count?: number;
  episodeCount?: number;
  language?: string;
  categories?: Record<string, string>;
  itunes_id?: number;
};

export type PodcastValueDestinationPayload = {
  name?: string;
  address: string;
  type?: string;
  split?: number | string;
  fee?: boolean;
  customKey?: string;
  customValue?: string;
};

export type PodcastValueModelPayload = {
  type?: string;
  method?: string;
  suggested?: string;
};

export type PodcastValuePayload = {
  model?: PodcastValueModelPayload | null;
  destinations?: PodcastValueDestinationPayload[];
} | null;

export type PodcastFundingPayload = {
  url?: string;
  message?: string;
} | null;

export type PodcastFeedDetail = {
  id: number;
  podcast_guid?: string;
  podcastGuid?: string;
  title: string;
  url: string;
  original_url?: string;
  originalUrl?: string;
  link?: string;
  description?: string;
  author?: string;
  owner_name?: string;
  ownerName?: string;
  image?: string;
  artwork?: string;
  last_update_time?: number;
  lastUpdateTime?: number;
  last_crawl_time?: number;
  lastCrawlTime?: number;
  last_parse_time?: number;
  lastParseTime?: number;
  last_good_http_status_time?: number;
  lastGoodHttpStatusTime?: number;
  last_http_status?: number;
  lastHttpStatus?: number;
  content_type?: string;
  contentType?: string;
  itunes_id?: number;
  itunesId?: number;
  itunes_type?: string;
  itunesType?: string;
  generator?: string;
  language?: string;
  explicit?: boolean | number;
  type?: number;
  medium?: string;
  dead?: number;
  chash?: string;
  episode_count?: number;
  episodeCount?: number;
  crawl_errors?: number;
  crawlErrors?: number;
  parse_errors?: number;
  parseErrors?: number;
  locked?: boolean | number;
  image_url_hash?: number | string;
  imageUrlHash?: number | string;
  oldest_item_pubdate?: number;
  oldest_item_publish_time?: number;
  oldestItemPubdate?: number;
  oldestItemPublishTime?: number;
  newest_item_pubdate?: number;
  newest_item_publish_time?: number;
  newestItemPubdate?: number;
  newestItemPublishTime?: number;
  value_created_on?: number;
  valueCreatedOn?: number;
  popularity?: number;
  trend_score?: number;
  trendScore?: number;
  priority?: number;
  in_polling_queue?: number | boolean;
  inPollingQueue?: number | boolean;
  created_on?: number;
  createdOn?: number;
  duplicate_of?: number;
  duplicateOf?: number;
  feedDuplicateOf?: number;
  value_block?: string;
  valueBlock?: string;
  categories?: Record<string, string>;
  funding?: PodcastFundingPayload;
  value?: PodcastValuePayload;
};

export type PodcastDetail = {
  feed: PodcastFeedDetail;
};

export type EpisodeTranscriptPayload = {
  url: string;
  type?: string;
  language?: string;
  rel?: string;
};

export type EpisodePersonPayload = {
  name: string;
  role?: string;
  group?: string;
  href?: string;
  img?: string;
  // 捕获额外字段，避免解析失败
  [key: string]: unknown;
};

export type EpisodeSoundbitePayload = {
  startTime?: number;
  duration?: number;
  title?: string;
};

export type EpisodeSocialInteractPayload = {
  url: string;
  protocol: string;
  accountId?: string;
  accountUrl?: string;
  priority?: number;
};

export type EpisodeDetail = {
  id: number;
  title: string;
  link?: string;
  description?: string;
  guid?: string;
  date_published?: number;
  datePublished?: number;
  date_crawled?: number;
  dateCrawled?: number;
  enclosure_url?: string;
  enclosureUrl?: string;
  enclosure_type?: string;
  enclosureType?: string;
  enclosure_length?: number;
  enclosureLength?: number;
  duration?: number;
  explicit?: number;
  episode?: number;
  episode_type?: string;
  episodeType?: string;
  season?: number;
  image?: string;
  image_url_hash?: number | string;
  imageUrlHash?: number | string;
  feed_id?: number;
  feedId?: number;
  feed_itunes_id?: number;
  feedItunesId?: number;
  feedImage?: string;
  feed_image?: string;
  feed_image_url_hash?: number | string;
  feedImageUrlHash?: number | string;
  feed_title?: string;
  feedTitle?: string;
  feed_url?: string;
  feedUrl?: string;
  feed_language?: string;
  feedLanguage?: string;
  feed_author?: string;
  feedAuthor?: string;
  feed_dead?: number;
  feedDead?: number;
  feed_duplicate_of?: number;
  feedDuplicateOf?: number;
  transcript_url?: string;
  transcriptUrl?: string;
  chapters_url?: string;
  chaptersUrl?: string;
  transcripts?: EpisodeTranscriptPayload[] | null;
  persons?: EpisodePersonPayload[] | null;
  soundbite?: EpisodeSoundbitePayload | null;
  soundbites?: EpisodeSoundbitePayload[] | null;
  social_interact?: EpisodeSocialInteractPayload[] | null;
  socialInteract?: EpisodeSocialInteractPayload[] | null;
  value?: PodcastValuePayload | null;
  start_time?: number;
  startTime?: number;
  end_time?: number;
  endTime?: number;
  status?: string;
  content_link?: string;
  contentLink?: string;
  value_created_on?: number;
  valueCreatedOn?: number;
  feed?: { id?: number | string } | null;
};

export type RecentDataFeed = {
  feedId: number;
  feedUrl: string;
  feedTitle: string;
  feedDescription?: string;
  feedImage?: string;
  feedLanguage?: string;
  feedItunesId?: number | null;
};

export type RecentDataEpisode = {
  episodeId: number;
  episodeTitle: string;
  episodeDescription?: string;
  episodeImage?: string;
  episodeTimestamp: number;
  episodeAdded: number;
  episodeEnclosureUrl?: string;
  episodeEnclosureLength?: number;
  episodeEnclosureType?: string;
  episodeDuration?: number;
  episodeType?: string;
  feedId: number;
};

export type RecentDataResponse = {
  status: boolean;
  feedCount: number;
  itemCount: number;
  max?: number | null;
  since: number;
  nextSince?: number | null;
  description?: string;
  data?: {
    position?: number;
    feeds: RecentDataFeed[];
    items: RecentDataEpisode[];
    nextSince?: number | null;
  };
};

type RequestInitAugmented = RequestInit & { skipAuth?: boolean };

function normalizeEnvValue(source?: string | null) {
  if (!source) {
    return undefined;
  }
  let normalized = source.trim();
  
  // 移除首尾的引号(单引号或双引号)
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }
  
  return normalized.length > 0 ? normalized : undefined;
}

function resolveCredentials(): PodcastIndexCredentials {
  const apiKey = normalizeEnvValue(process.env.PODCASTINDEX_API_KEY);
  const apiSecret = normalizeEnvValue(process.env.PODCASTINDEX_API_SECRET);
  const userAgent =
    normalizeEnvValue(process.env.PODCASTINDEX_USER_AGENT) ??
    "PodcastIndexManager/1.0";

  if (!apiKey || !apiSecret) {
    throw new Error(
      "PODCASTINDEX_API_KEY and PODCASTINDEX_API_SECRET must be set in the environment",
    );
  }

  return {
    apiKey,
    apiSecret,
    userAgent,
  };
}

function buildAuthHeaders({
  apiKey,
  apiSecret,
  userAgent,
}: PodcastIndexCredentials) {
  const authDate = Math.floor(Date.now() / 1000).toString();
  const concatenated = `${apiKey}${apiSecret}${authDate}`;
  const hash = createHash("sha1")
    .update(concatenated)
    .digest("hex");

  return {
    "User-Agent": userAgent,
    "X-Auth-Date": authDate,
    "X-Auth-Key": apiKey,
    Authorization: hash,
  } satisfies Record<string, string>;


// return {
//     "User-Agent": userAgent,
//     "X-Auth-Date": "1760544744",
//     "X-Auth-Key": "ZRWVT5W3NGTBRYMBYZXT",
//     Authorization: "44db09bc2d2a80db9fd0cbb4acea9946ccfb90bb",
//   } satisfies Record<string, string>;
}

export class PodcastIndexClient {
  constructor(private readonly credentials = resolveCredentials()) {}

  private async request<T>(
    path: string,
    init: RequestInitAugmented = {},
  ): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const headers = new Headers(init.headers ?? {});

    if (!init.skipAuth) {
      const authHeaders = buildAuthHeaders(this.credentials);
      for (const [key, value] of Object.entries(authHeaders)) {
        headers.set(key, value);
      }
    }

    headers.set("Content-Type", "application/json");

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      await rateLimiter();

      let response: Response;
      try {
        console.log(`Fetching========== ${url}`);
        response = await fetch(url, {
          ...init,
          headers,
          cache: "no-store",
        });
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
          continue;
        }
        throw new PodcastIndexRequestError(
          "无法连接 PodcastIndex API，请检查网络连接和访问凭据。",
          { cause: error },
        );
      }

      if (response.ok) {
        return (await response.json()) as T;
      }

      const errorBody = await response.text();
      const status = response.status;

      if (status === 429 && attempt < MAX_RETRIES) {
        const retryAfterMs =
          parseRetryAfter(response.headers.get("retry-after")) ??
          RETRY_BASE_DELAY_MS * (attempt + 1);
        const delay = Math.min(
          Math.max(retryAfterMs, RETRY_BASE_DELAY_MS),
          MAX_RETRY_WAIT_MS,
        );
        if (delay > 0) {
          await sleep(delay);
        }
        continue;
      }

      if (status >= 500 && status < 600 && attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
        continue;
      }

      throw new PodcastIndexRequestError(
        `PodcastIndex 请求失败（${status} ${response.statusText}）`,
        { cause: errorBody },
      );
    }

    throw new PodcastIndexRequestError(
      "多次尝试调用 PodcastIndex API 仍然失败，请稍后重试。",
    );
  }

  async searchPodcasts(term: string, max = 25): Promise<SearchPodcast[]> {
    const params = new URLSearchParams({
      q: term,
      max: String(max),
    });
    const data = await this.request<{ feeds?: SearchPodcast[] }>(
      `/search/byterm?${params.toString()}`,
    );
    return data.feeds ?? [];
  }

  async podcastByFeedId(feedId: number): Promise<PodcastDetail["feed"] | null> {
    const params = new URLSearchParams({ id: String(feedId) });
    const data = await this.request<PodcastDetail>(`/podcasts/byfeedid?${params}`);
    return data.feed ?? null;
  }

  async episodesByFeedId(
    feedId: number,
    options: { max?: number; since?: number } = {},
  ): Promise<EpisodeDetail[]> {
    const params = new URLSearchParams({ id: String(feedId) });
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.since) {
      params.set("since", String(options.since));
    }
    const data = await this.request<{ items?: EpisodeDetail[] }>(
      `/episodes/byfeedid?${params.toString()}`,
    );
    return data.items ?? [];
  }

  async recentEpisodes(options: { max?: number; before?: number } = {}) {
    const params = new URLSearchParams();
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.before) {
      params.set("before", String(options.before));
    }
    const data = await this.request<{ items?: EpisodeDetail[] }>(
      `/recent/episodes?${params.toString()}`,
    );
    return data.items ?? [];
  }

  async podcastByGuid(guid: string): Promise<PodcastDetail["feed"] | null> {
    const params = new URLSearchParams({ guid });
    const data = await this.request<PodcastDetail>(`/podcasts/byguid?${params}`);
    return data.feed ?? null;
  }

  async podcastByFeedUrl(url: string): Promise<PodcastDetail["feed"] | null> {
    const params = new URLSearchParams({ url });
    const data = await this.request<PodcastDetail>(`/podcasts/byfeedurl?${params}`);
    return data.feed ?? null;
  }

  async podcastByItunesId(itunesId: number): Promise<PodcastDetail["feed"] | null> {
    const params = new URLSearchParams({ id: String(itunesId) });
    const data = await this.request<PodcastDetail>(`/podcasts/byitunesid?${params}`);
    return data.feed ?? null;
  }

  async addByFeedUrl(url: string): Promise<PodcastDetail["feed"] | null> {
    const params = new URLSearchParams({ url });
    const data = await this.request<PodcastDetail>(`/add/byfeedurl?${params}`);
    return data.feed ?? null;
  }

  async episodesByFeedUrl(
    url: string,
    options: { max?: number; since?: number } = {},
  ): Promise<EpisodeDetail[]> {
    const params = new URLSearchParams({ url });
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.since) {
      params.set("since", String(options.since));
    }
    const data = await this.request<{ items?: EpisodeDetail[] }>(
      `/episodes/byfeedurl?${params.toString()}`,
    );
    return data.items ?? [];
  }

  async recentFeeds(options: { max?: number; since?: number; lang?: string } = {}) {
    const params = new URLSearchParams();
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.since) {
      params.set("since", String(options.since));
    }
    if (options.lang) {
      params.set("lang", options.lang);
    }
    const data = await this.request<{ feeds?: SearchPodcast[] }>(
      `/recent/feeds?${params.toString()}`,
    );
    return data.feeds ?? [];
  }

  async recentData(options: { max?: number; since?: number } = {}) {
    const params = new URLSearchParams();
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.since) {
      params.set("since", String(options.since));
    }
    const query = params.toString();
    return this.request<RecentDataResponse>(
      query ? `/recent/data?${query}` : "/recent/data",
    );
  }

  async trendingPodcasts(options: { max?: number; lang?: string; cat?: string } = {}) {
    const params = new URLSearchParams();
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.lang) {
      params.set("lang", options.lang);
    }
    if (options.cat) {
      params.set("cat", options.cat);
    }
    const data = await this.request<{ feeds?: SearchPodcast[] }>(
      `/podcasts/trending?${params.toString()}`,
    );
    return data.feeds ?? [];
  }

  async podcastsByMedium(options: { medium: string; max?: number; startAt?: number }) {
    const params = new URLSearchParams({ medium: options.medium });
    if (options.max) {
      params.set("max", String(options.max));
    }
    if (options.startAt) {
      params.set("start_at", String(options.startAt));
    }
    const data = await this.request<{ feeds?: PodcastFeedDetail[] }>(
      `/podcasts/bymedium?${params.toString()}`,
    );
    return data.feeds ?? [];
  }

  async podcastsByTag(options: {
    tag: "podcast-value" | "podcast-valueTimeSplit";
    max?: number;
    startAt?: number;
  }) {
    const queryParts: string[] = [options.tag];
    if (options.max) {
      queryParts.push(`max=${options.max}`);
    }
    if (options.startAt) {
      queryParts.push(`start_at=${options.startAt}`);
    }
    const query = queryParts.join("&");
    const data = await this.request<{ feeds?: PodcastFeedDetail[] }>(
      `/podcasts/bytag?${query}`,
    );
    return data.feeds ?? [];
  }
}

export function createPodcastIndexClient(
  credentials?: PodcastIndexCredentials,
) {
  return new PodcastIndexClient(credentials ?? resolveCredentials());
}

export function getAuthHeadersForTesting(
  credentials?: PodcastIndexCredentials,
) {
  return buildAuthHeaders(credentials ?? resolveCredentials());
}

function createRateLimiter(minInterval: number) {
  if (minInterval <= 0) {
    return async () => undefined;
  }

  let lastInvocation = 0;
  let pending = Promise.resolve();

  return () => {
    const run = async () => {
      const now = Date.now();
      const wait = Math.max(lastInvocation + minInterval - now, 0);
      if (wait > 0) {
        await sleep(wait);
      }
      lastInvocation = Date.now();
    };

    pending = pending.then(run, run);
    return pending;
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) {
    return null;
  }

  const numeric = Number(header);
  if (Number.isFinite(numeric)) {
    return numeric * 1_000;
  }

  const date = Number(new Date(header));
  if (Number.isFinite(date)) {
    return Math.max(date - Date.now(), 0);
  }

  return null;
}
