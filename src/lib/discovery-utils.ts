import type { DiscoveryItem } from "@/types/discovery";
import type { PodcastFeedDetail, SearchPodcast } from "@/lib/podcast-index";

type FeedLike = Record<string, unknown>;

export function normalizeFeed(feed: FeedLike): DiscoveryItem | null {
  const title =
    typeof feed.title === "string"
      ? sanitizePlainText(feed.title)
      : typeof (feed as { collectionName?: string }).collectionName === "string"
        ? sanitizePlainText((feed as { collectionName: string }).collectionName)
        : typeof feed.feedTitle === "string"
          ? sanitizePlainText(feed.feedTitle as string)
          : null;
  if (!title) {
    return null;
  }

  const feedIdRaw = (feed as { id?: number }).id ?? (feed as { feedId?: number }).feedId;
  const feedId = typeof feedIdRaw === "number" ? feedIdRaw : undefined;
  const url =
    (typeof (feed as { url?: string }).url === "string" && (feed as { url: string }).url) ||
    (typeof (feed as { feedUrl?: string }).feedUrl === "string" &&
      (feed as { feedUrl: string }).feedUrl) ||
    (typeof (feed as { feed_url?: string }).feed_url === "string" &&
      (feed as { feed_url: string }).feed_url) ||
    undefined;
  const link =
    (typeof (feed as { link?: string }).link === "string" && (feed as { link: string }).link) ||
    (typeof (feed as { website?: string }).website === "string" &&
      (feed as { website: string }).website) ||
    undefined;
  const guid =
    (typeof (feed as { podcast_guid?: string }).podcast_guid === "string" &&
      (feed as { podcast_guid: string }).podcast_guid) ||
    (typeof (feed as { podcastGuid?: string }).podcastGuid === "string" &&
      (feed as { podcastGuid: string }).podcastGuid) ||
    null;
  const descriptionRaw =
    (typeof (feed as { description?: string }).description === "string" &&
      (feed as { description: string }).description) ||
    (typeof (feed as { feedDescription?: string }).feedDescription === "string" &&
      (feed as { feedDescription: string }).feedDescription) ||
    undefined;
  const description = descriptionRaw
    ? truncateText(sanitizePlainText(descriptionRaw), 480)
    : undefined;
  const descriptionHtml = descriptionRaw
    ? sanitizeDescriptionHtml(descriptionRaw, 2_000)
    : undefined;

  const image =
    (typeof (feed as { artwork?: string }).artwork === "string" &&
      (feed as { artwork: string }).artwork) ||
    (typeof (feed as { image?: string }).image === "string" &&
      (feed as { image: string }).image) ||
    (typeof (feed as { feedImage?: string }).feedImage === "string" &&
      (feed as { feedImage: string }).feedImage) ||
    undefined;

  const language =
    (typeof (feed as { language?: string }).language === "string" &&
      (feed as { language: string }).language) ||
    (typeof (feed as { feedLanguage?: string }).feedLanguage === "string" &&
      (feed as { feedLanguage: string }).feedLanguage) ||
    null;

  const medium =
    (typeof (feed as { medium?: string }).medium === "string" &&
      (feed as { medium: string }).medium) ||
    (typeof (feed as { podcastMedium?: string }).podcastMedium === "string" &&
      (feed as { podcastMedium: string }).podcastMedium) ||
    null;

  const authorRaw =
    (typeof (feed as { author?: string }).author === "string" &&
      (feed as { author: string }).author) ||
    (typeof (feed as { ownerName?: string }).ownerName === "string" &&
      (feed as { ownerName: string }).ownerName) ||
    (typeof (feed as { owner_name?: string }).owner_name === "string" &&
      (feed as { owner_name: string }).owner_name) ||
    (typeof (feed as { feedAuthor?: string }).feedAuthor === "string" &&
      (feed as { feedAuthor: string }).feedAuthor) ||
    undefined;
  const author = authorRaw ? sanitizePlainText(authorRaw) : undefined;

  const categoriesSource =
    (feed as { categories?: Record<string, string> | string[] }).categories ?? [];
  const categories = Array.isArray(categoriesSource)
    ? categoriesSource
        .filter((category): category is string => typeof category === "string")
        .map((category) => sanitizePlainText(category))
        .filter(Boolean)
    : typeof categoriesSource === "object" && categoriesSource !== null
      ? Object.values(categoriesSource)
          .filter((category): category is string => typeof category === "string")
          .map((category) => sanitizePlainText(category))
          .filter(Boolean)
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

  const lastUpdateTimestamp = pickNumeric(
    (feed as { last_update_time?: number }).last_update_time,
    (feed as { lastUpdateTime?: number }).lastUpdateTime,
    (feed as { valueCreatedOn?: number }).valueCreatedOn,
    (feed as { last_good_http_status_time?: number }).last_good_http_status_time,
    (feed as { lastGoodHttpStatusTime?: number }).lastGoodHttpStatusTime,
  );

  const popularity = pickNumeric(
    (feed as { popularity?: number }).popularity,
    (feed as { trendScore?: number }).trendScore,
  );

  const trendScore = pickNumeric(
    (feed as { trend_score?: number }).trend_score,
    (feed as { trendScore?: number }).trendScore,
  );

  const priority = pickNumeric(
    (feed as { priority?: number }).priority,
    (feed as { feedPriority?: number }).feedPriority,
  );

  const createdTimestamp = pickNumeric(
    (feed as { created_on?: number }).created_on,
    (feed as { createdTimestamp?: number }).createdTimestamp,
  );

  const episodeCount = pickNumeric(
    (feed as { episodeCount?: number }).episodeCount,
    (feed as { episode_count?: number }).episode_count,
  );

  const explicit = toBoolean(
    (feed as { explicit?: boolean }).explicit,
    (feed as { feedItunesExplicit?: boolean | number }).feedItunesExplicit,
  );

  const hasValue =
    toBoolean(
      (feed as { value?: { model?: { type?: string | null } | null } }).value?.model?.type,
      (feed as { hasValue?: boolean | number }).hasValue,
      (feed as { valueModelType?: string | null }).valueModelType,
    ) ?? undefined;

  const valueDestinationsCount = pickNumeric(
    (feed as { valueDestinationsCount?: number }).valueDestinationsCount,
    (feed as { value?: { destinations?: unknown[] | null } }).value?.destinations?.length ?? 0,
  );

  const funding =
    (feed as { funding?: { url?: string; message?: string } | null }).funding ?? null;

  const valueModelType =
    (feed as { valueModelType?: string | null }).valueModelType ??
    ((feed as { value?: { model?: { type?: string } | null } | null }).value?.model?.type ??
      null);

  const itunesIdRaw = pickNumeric(
    (feed as { itunes_id?: number }).itunes_id,
    (feed as { itunesId?: number }).itunesId,
  );

  const numericItunesId =
    typeof itunesIdRaw === "number" && Number.isFinite(itunesIdRaw)
      ? itunesIdRaw
      : null;

  const detailIdentity = buildDetailIdentity({
    feedId,
    guid,
    url,
    itunesId: numericItunesId ?? undefined,
  });

  return {
    key: detailIdentity ?? createRandomKey(),
    feedId,
    title,
    description,
    descriptionHtml,
    url,
    link,
    image,
    author,
    language,
    medium,
    categories,
    newestItemTimestamp: newestTimestamp,
    guid,
    explicit,
    episodeCount: typeof episodeCount === "number" ? episodeCount : null,
    itunesId: numericItunesId,
    lastUpdateTimestamp,
    createdTimestamp,
    popularity,
    trendScore,
    priority,
    hasValue,
    valueDestinationsCount:
      typeof valueDestinationsCount === "number" ? valueDestinationsCount : null,
    valueModelType: valueModelType ?? null,
    funding,
    detailIdentity,
  };
}

export function prepareDiscoveryItems(items: DiscoveryItem[]): DiscoveryItem[] {
  const deduped = new Map<string, DiscoveryItem>();
  for (const item of items) {
    const preferredKey = item.detailIdentity ?? item.key;
    const existing = deduped.get(preferredKey);
    if (!existing) {
      deduped.set(preferredKey, item);
      continue;
    }
    deduped.set(preferredKey, pickPreferredItem(existing, item));
  }
  return Array.from(deduped.values());
}

export function getDetailHref(item: DiscoveryItem): string | null {
  if (!item.detailIdentity) {
    return null;
  }
  if (item.detailIdentity.startsWith("feed:") && item.feedId) {
    return `/podcast/${item.feedId}`;
  }
  if (item.detailIdentity.startsWith("guid:")) {
    return `/podcast/guid/${item.detailIdentity.split(":")[1] ?? ""}`;
  }
  if (item.detailIdentity.startsWith("itunes:")) {
    return `/podcast/itunes/${item.detailIdentity.split(":")[1] ?? ""}`;
  }
  if (item.detailIdentity.startsWith("url:")) {
    return `/podcast/feed?url=${decodeURIComponent(
      item.detailIdentity.slice("url:".length),
    )}`;
  }
  return null;
}

export function formatTimestamp(timestamp?: number | null): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }
  const date =
    timestamp > 10_000_000_000 ? new Date(timestamp) : new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function sanitizePlainText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function pickPreferredItem(current: DiscoveryItem, candidate: DiscoveryItem): DiscoveryItem {
  return scoreCandidate(candidate) > scoreCandidate(current) ? candidate : current;
}

function scoreCandidate(item: DiscoveryItem): number {
  let score = 0;
  if (item.feedId !== undefined) {
    score += 8;
  }
  if (item.guid) {
    score += 4;
  }
  if (item.url) {
    score += 2;
  }
  if (item.description) {
    score += 1;
  }
  if (item.categories.length) {
    score += 1;
  }
  if (item.image) {
    score += 1;
  }
  if (item.hasValue) {
    score += 1;
  }
  if (item.episodeCount) {
    score += 1;
  }
  return score;
}

function pickNumeric(
  ...values: Array<number | string | null | undefined>
): number | null {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
}

function toBoolean(...values: Array<unknown>): boolean | null {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "no", "n"].includes(normalized)) {
        return false;
      }
    }
  }
  return null;
}

export function buildDetailIdentity({
  feedId,
  guid,
  url,
  itunesId,
}: {
  feedId?: number;
  guid?: string | null;
  url?: string;
  itunesId?: number | null;
}): string | null {
  if (feedId !== undefined) {
    return `feed:${feedId}`;
  }
  if (guid) {
    return `guid:${encodeURIComponent(guid)}`;
  }
  if (itunesId) {
    return `itunes:${itunesId}`;
  }
  if (url) {
    return `url:${encodeURIComponent(url)}`;
  }
  return null;
}

export function mapFeedsToDiscoveryItems(
  feeds: Array<FeedLike | PodcastFeedDetail | SearchPodcast>,
): DiscoveryItem[] {
  const normalized = feeds
    .map((feed) => normalizeFeed(feed))
    .filter((item): item is DiscoveryItem => item !== null);
  return prepareDiscoveryItems(normalized);
}

const ALLOWED_DESCRIPTION_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
]);

function sanitizeDescriptionHtml(input: string, maxLength: number): string {
  if (!input) {
    return "";
  }

  let value = String(input);
  value = value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  value = value.replace(/<\/?([a-z0-9:-]+)([^>]*)>/gi, (match, tagName, rawAttrs) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_DESCRIPTION_TAGS.has(tag)) {
      return "";
    }

    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    if (tag === "br") {
      return "<br />";
    }

    if (tag === "a") {
      const hrefMatch = rawAttrs.match(/href=(["'])(.*?)\1/i);
      const rawHref = hrefMatch ? hrefMatch[2] : "";
      const safeHref =
        rawHref && /^https?:\/\//i.test(rawHref)
          ? rawHref
          : rawHref && rawHref.startsWith("#")
            ? rawHref
            : "";
      const rel = 'rel="noreferrer noopener"';
      const target = safeHref && !safeHref.startsWith("#") ? ' target="_blank"' : "";
      const hrefAttr = safeHref ? ` href="${escapeHtmlAttribute(safeHref)}"` : "";
      return `<a${hrefAttr}${target} ${rel}>`;
    }

    return `<${tag}>`;
  });

  value = value.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
  value = value.replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");

  if (maxLength > 0 && value.length > maxLength) {
    value = `${value.slice(0, maxLength).trimEnd()}…`;
  }

  return value;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createRandomKey(): string {
  const globalCrypto = typeof crypto !== "undefined" ? crypto : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `podcast-${Math.random().toString(36).slice(2, 12)}`;
}
