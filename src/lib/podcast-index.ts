// src/lib/net-bootstrap.ts（建议新建一个文件，尽早 import）
import dns from "node:dns";
import { setGlobalDispatcher, Agent, ProxyAgent } from "undici";

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
        family: 4,       // 强制 IPv4，避免走 IPv6 黑洞
      },
    });

setGlobalDispatcher(agent);

// 3) 可选：白名单直连该域名（即使系统/进程设了代理）
const noProxy = process.env.NO_PROXY || process.env.no_proxy || "";
if (!/(^|,)\s*api\.podcastindex\.org\s*(,|$)/i.test(noProxy)) {
  process.env.NO_PROXY = [noProxy, "api.podcastindex.org"].filter(Boolean).join(",");
}



import { createHash } from "node:crypto";
// https://api.podcastindex.org/api/1.0/search/byterm?q=batman+university&pretty
const API_BASE = "https://api.podcastindex.org/api/1.0" as const;

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
  image?: string;
  artwork?: string;
  podcastGuid?: string;
  newestItemPublishTime?: number;
  episodeCount?: number;
  language?: string;
  categories?: Record<string, string>;
};

export type PodcastDetail = {
  feed: {
    id: number;
    podcastGuid?: string;
    title: string;
    url: string;
    originalUrl?: string;
    link?: string;
    description?: string;
    author?: string;
    ownerName?: string;
    image?: string;
    artwork?: string;
    lastUpdateTime?: number;
    lastCrawlTime?: number;
    lastParseTime?: number;
    newestItemPublishTime?: number;
    episodeCount?: number;
    explicit?: boolean;
    medium?: string;
    locked?: boolean;
    categories?: Record<string, string>;
    language?: string;
    funding?: unknown;
    value?: unknown;
  };
};

export type EpisodeDetail = {
  id: number;
  title: string;
  link?: string;
  description?: string;
  guid?: string;
  datePublished?: number;
  dateCrawled?: number;
  enclosureUrl?: string;
  enclosureType?: string;
  enclosureLength?: number;
  duration?: number;
  explicit?: number;
  episode?: number;
  season?: number;
  image?: string;
  feedId: number;
  feedTitle?: string;
  feedUrl?: string;
  feedLanguage?: string;
  transcriptUrl?: string;
  chaptersUrl?: string;
  persons?: unknown;
  socialInteract?: unknown;
  value?: unknown;
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

  // 调试日志
  console.log("🔐 Auth Debug:");
  console.log("  Raw API Key from env:", process.env.PODCASTINDEX_API_KEY);
  console.log("  Raw API Secret from env:", process.env.PODCASTINDEX_API_SECRET);
  console.log("  Normalized API Key:", apiKey);
  console.log("  Normalized API Secret:", apiSecret);
  console.log("  Timestamp:", authDate);
  console.log("  Concatenated:", concatenated);
  console.log("  Hash:", hash);

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

    let response: Response;
    try {
      console.log(`Fetching========== ${url}`);
      response = await fetch(url, {
        ...init,
        headers,
        cache: "no-store",
      });
    } catch (error) {
      throw new PodcastIndexRequestError(
        "无法连接 PodcastIndex API，请检查网络连接和访问凭据。",
        { cause: error },
      );
    }

    if (!response.ok) {
      const text = await response.text();
      throw new PodcastIndexRequestError(
        `PodcastIndex 请求失败（${response.status} ${response.statusText}）`,
        { cause: text },
      );
    }

    return (await response.json()) as T;
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
