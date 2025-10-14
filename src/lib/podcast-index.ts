import { createHash } from "node:crypto";

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

function resolveCredentials(): PodcastIndexCredentials {
  const apiKey = process.env.PODCASTINDEX_API_KEY;
  const apiSecret = process.env.PODCASTINDEX_API_SECRET;
  const userAgent =
    process.env.PODCASTINDEX_USER_AGENT ?? "PodcastIndexManager/1.0";

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
  const hash = createHash("sha1")
    .update(`${apiKey}${apiSecret}${authDate}`)
    .digest("hex");

  return {
    "User-Agent": userAgent,
    "X-Auth-Date": authDate,
    "X-Auth-Key": apiKey,
    Authorization: hash,
  } satisfies Record<string, string>;
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
