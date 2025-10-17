import type { PrismaClient } from "@prisma/client";

import type {
  EpisodeDetail,
  EpisodePersonPayload,
  EpisodeSoundbitePayload,
  EpisodeSocialInteractPayload,
  EpisodeTranscriptPayload,
  PodcastFeedDetail,
  PodcastIndexClient,
} from "@/lib/podcast-index";

type PodcastSyncResult = {
  podcast: any;
  episodeDelta: number;
  episodes: any[];
};

const toUnixDate = (value?: number | string | bigint | null) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const numeric =
    typeof value === "string"
      ? Number.parseFloat(value)
      : typeof value === "bigint"
        ? Number(value)
        : value;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }
  return new Date(numeric * 1000);
};

const coerceBoolean = (value?: boolean | number | null) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return undefined;
};

const toOptionalBigInt = (value?: number | string | bigint | null) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    try {
      return BigInt(Math.trunc(value));
    } catch (error) {
      console.warn("Failed to coerce number to BigInt", { value, error });
    }
  }
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return BigInt(value);
    } catch (error) {
      console.warn("Failed to coerce string to BigInt", { value, error });
    }
  }
  return undefined;
};

const coerceNumber = (value?: number | string | null) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : undefined;
};

const coerceString = (value?: unknown) => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
};

const extractNumeric = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "bigint"
  ) {
    return value;
  }
  return undefined;
};

const asArray = <T>(input: T | T[] | null | undefined): T[] => {
  if (Array.isArray(input)) {
    return input.filter(Boolean) as T[];
  }
  return input ? [input] : [];
};

type NormalizedFeedPayload = {
  createData: Record<string, unknown>;
  updateData: Record<string, unknown>;
  categories: { id: number; name: string }[];
  valueDestinations: {
    name: string | null;
    address: string;
    type: string | null;
    split: number | null;
    fee: boolean | null;
    custom_key: string | null;
    custom_value: string | null;
  }[];
};

type NormalizedEpisodePayload = {
  remoteId?: bigint;
  guid: string;
  data: Record<string, unknown>;
  transcripts: {
    url: string;
    type: string | null;
    language: string | null;
    rel: string | null;
  }[];
  persons: {
    person_index_id: number | null;
    name: string;
    role: string | null;
    group_name: string | null;
    href: string | null;
    img: string | null;
    metadata?: Record<string, unknown>;
  }[];
  soundbites: { start_time: number; duration: number; title: string }[];
  socialInteractions: {
    url: string;
    protocol: string;
    account_id: string | null;
    account_url: string | null;
    priority: number | null;
  }[];
  valueDestinations: {
    name: string | null;
    address: string;
    type: string | null;
    split: number | null;
    fee: boolean | null;
    custom_key: string | null;
    custom_value: string | null;
  }[];
};

const normalizeFeedPayload = (feed: PodcastFeedDetail): NormalizedFeedPayload => {
  const categories = feed.categories
    ? Object.entries(feed.categories).map(([categoryId, name]) => ({
        id: Number(categoryId),
        name,
      }))
    : [];

  const destinations = feed.value?.destinations?.map((destination) => ({
    name: destination.name ?? null,
    address: destination.address,
    type: destination.type ?? null,
    split: coerceNumber(destination.split) ?? null,
    fee:
      destination.fee === undefined || destination.fee === null
        ? null
        : Boolean(destination.fee),
    custom_key: destination.customKey ?? null,
    custom_value: destination.customValue ?? null,
  })) ?? [];

  const inPollingRaw = feed.in_polling_queue ?? feed.inPollingQueue;
  const inPollingQueue =
    typeof inPollingRaw === "boolean"
      ? inPollingRaw
      : typeof inPollingRaw === "number"
        ? inPollingRaw !== 0
        : null;

  const data: Record<string, unknown> = {
    podcast_index_id: feed.id,
    podcast_guid: coerceString(feed.podcast_guid ?? feed.podcastGuid) ?? null,
    title: feed.title,
    url: feed.url,
    original_url: feed.original_url ?? feed.originalUrl ?? null,
    link: feed.link ?? null,
    description: feed.description ?? null,
    author: feed.author ?? null,
    owner_name: feed.owner_name ?? feed.ownerName ?? null,
    owner_email: coerceString((feed as Record<string, unknown>).owner_email) ?? null,
    image: feed.image ?? null,
    artwork: feed.artwork ?? null,
    last_update_time: toUnixDate(feed.last_update_time ?? feed.lastUpdateTime) ?? null,
    last_crawl_time: toUnixDate(feed.last_crawl_time ?? feed.lastCrawlTime) ?? null,
    last_parse_time: toUnixDate(feed.last_parse_time ?? feed.lastParseTime) ?? null,
    last_good_http_status_time: toUnixDate(
      feed.last_good_http_status_time ?? feed.lastGoodHttpStatusTime,
    ) ?? null,
    last_http_status: coerceNumber(feed.last_http_status ?? feed.lastHttpStatus) ?? null,
    content_type: coerceString(feed.content_type ?? feed.contentType) ?? null,
    itunes_id: coerceNumber(feed.itunes_id ?? feed.itunesId) ?? null,
    itunes_type: coerceString(feed.itunes_type ?? feed.itunesType) ?? null,
    generator: coerceString(feed.generator) ?? null,
    language: coerceString(feed.language) ?? null,
    explicit: coerceBoolean(feed.explicit) ?? null,
    type: coerceNumber(feed.type) ?? null,
    medium: coerceString(feed.medium) ?? null,
    dead: coerceNumber(feed.dead) ?? null,
    priority: coerceNumber(feed.priority) ?? null,
    in_polling_queue: inPollingQueue,
    chash: coerceString(feed.chash) ?? null,
    created_on: toUnixDate(feed.created_on ?? feed.createdOn) ?? null,
    episode_count: coerceNumber(feed.episode_count ?? feed.episodeCount) ?? null,
    crawl_errors: coerceNumber(feed.crawl_errors ?? feed.crawlErrors) ?? null,
    parse_errors: coerceNumber(feed.parse_errors ?? feed.parseErrors) ?? null,
    locked: coerceBoolean(feed.locked) ?? null,
    image_url_hash: toOptionalBigInt(feed.image_url_hash ?? feed.imageUrlHash) ?? null,
    newest_item_pubdate: toUnixDate(
      feed.newest_item_pubdate ??
        feed.newest_item_publish_time ??
        feed.newestItemPubdate ??
        feed.newestItemPublishTime,
    ) ?? null,
    popularity: coerceNumber(feed.popularity) ?? null,
    trend_score: coerceNumber(feed.trend_score ?? feed.trendScore) ?? null,
    duplicate_of_feed_id:
      coerceNumber(feed.duplicate_of ?? feed.duplicateOf ?? feed.feedDuplicateOf) ?? null,
    value_created_on: toUnixDate(feed.value_created_on ?? feed.valueCreatedOn) ?? null,
    value_block: coerceString(feed.value_block ?? feed.valueBlock) ?? null,
    funding_url: feed.funding?.url ?? null,
    funding_message: feed.funding?.message ?? null,
    value_model_type: feed.value?.model?.type ?? null,
    value_model_method: feed.value?.model?.method ?? null,
    value_model_suggested: feed.value?.model?.suggested ?? null,
  };

  return {
    createData: data,
    updateData: { ...data },
    categories,
    valueDestinations: destinations,
  };
};

const normalizeEpisodePayload = (item: EpisodeDetail): NormalizedEpisodePayload => {
  const remoteId = toOptionalBigInt(item.id);
  const guid = coerceString(item.guid) ?? `pi-${item.id}`;
  const value = item.value ?? null;

  const data: Record<string, unknown> = {
    feed_id: coerceNumber(item.feed_id ?? item.feedId) ?? null,
    title: item.title,
    description: item.description ?? null,
    link: item.link ?? null,
    date_published: toUnixDate(extractNumeric(item.date_published ?? item.datePublished)) ?? null,
    date_crawled: toUnixDate(extractNumeric(item.date_crawled ?? item.dateCrawled)) ?? null,
    enclosure_url: item.enclosure_url ?? item.enclosureUrl ?? null,
    enclosure_type: item.enclosure_type ?? item.enclosureType ?? null,
    enclosure_length: coerceNumber(item.enclosure_length ?? item.enclosureLength) ?? null,
    duration: coerceNumber(item.duration) ?? null,
    explicit: coerceBoolean(item.explicit) ?? null,
    episode: coerceNumber(item.episode) ?? null,
    episode_type: item.episode_type ?? item.episodeType ?? null,
    season: coerceNumber(item.season) ?? null,
    image: item.image ?? null,
    image_url_hash: toOptionalBigInt(item.image_url_hash ?? item.imageUrlHash) ?? null,
    feed_itunes_id: coerceNumber(item.feed_itunes_id ?? item.feedItunesId) ?? null,
    feed_image: item.feed_image ?? item.feedImage ?? null,
    feed_image_url_hash: toOptionalBigInt(
      item.feed_image_url_hash ?? item.feedImageUrlHash,
    ) ?? null,
    feed_url: item.feed_url ?? item.feedUrl ?? null,
    feed_title: item.feed_title ?? item.feedTitle ?? null,
    feed_author: item.feed_author ?? item.feedAuthor ?? null,
    feed_language: item.feed_language ?? item.feedLanguage ?? null,
    feed_dead: coerceNumber(item.feed_dead ?? item.feedDead) ?? null,
    feed_duplicate_of: coerceNumber(item.feed_duplicate_of ?? item.feedDuplicateOf) ?? null,
    transcript_url: item.transcript_url ?? item.transcriptUrl ?? null,
    chapters_url: item.chapters_url ?? item.chaptersUrl ?? null,
    content_link: item.content_link ?? item.contentLink ?? null,
    start_time: toUnixDate(
      extractNumeric((item as Record<string, unknown>).start_time ?? item.startTime),
    ) ?? null,
    end_time: toUnixDate(
      extractNumeric((item as Record<string, unknown>).end_time ?? item.endTime),
    ) ?? null,
    status: coerceString(item.status) ?? null,
    value_model_type: value?.model?.type ?? null,
    value_model_method: value?.model?.method ?? null,
    value_model_suggested: value?.model?.suggested ?? null,
  };

  const transcripts = asArray(item.transcripts)
    .filter((transcript): transcript is EpisodeTranscriptPayload => Boolean(transcript?.url))
    .map((transcript) => ({
      url: transcript.url,
      type: transcript.type ?? null,
      language: transcript.language ?? null,
      rel: (transcript as Record<string, unknown>).rel
        ? String((transcript as Record<string, unknown>).rel)
        : null,
    }));

  const persons = asArray(item.persons)
    .filter((person): person is EpisodePersonPayload => Boolean(person?.name))
    .map((person) => {
      const { name, role, group, href, img, ...rest } = person;
      const personId = coerceNumber((person as { id?: number | string }).id) ?? null;
      const metadata = Object.keys(rest).length ? rest : undefined;
      return {
        person_index_id: personId,
        name,
        role: role ?? null,
        group_name: group ?? null,
        href: href ?? null,
        img: img ?? null,
        metadata,
      };
    });

  const soundbites = [
    ...asArray(item.soundbite ?? undefined),
    ...asArray(item.soundbites ?? undefined),
  ]
    .map((soundbite) => {
      const startRaw = extractNumeric(
        (soundbite as Record<string, unknown>).start_time ?? soundbite.startTime,
      );
      const durationRaw = extractNumeric(soundbite.duration);
      const title = coerceString(soundbite.title);
      if (
        startRaw === undefined ||
        durationRaw === undefined ||
        !title ||
        Number.isNaN(Number(startRaw)) ||
        Number.isNaN(Number(durationRaw))
      ) {
        return null;
      }
      return {
        start_time: Math.trunc(Number(startRaw)),
        duration: Math.trunc(Number(durationRaw)),
        title,
      };
    })
    .filter(Boolean) as { start_time: number; duration: number; title: string }[];

  const socialInteractions = [
    ...asArray(item.social_interact ?? undefined),
    ...asArray(item.socialInteract ?? undefined),
  ]
    .map((interaction) => {
      if (!interaction || typeof interaction !== "object") {
        return null;
      }
      const record = interaction as EpisodeSocialInteractPayload & Record<string, unknown>;
      if (!record.url || !record.protocol) {
        return null;
      }
      return {
        url: record.url,
        protocol: record.protocol,
        account_id: record.accountId ?? null,
        account_url: record.accountUrl ?? null,
        priority: coerceNumber(record.priority) ?? null,
      };
    })
    .filter(Boolean) as {
    url: string;
    protocol: string;
    account_id: string | null;
    account_url: string | null;
    priority: number | null;
  }[];

  const valueDestinations = value?.destinations?.map((destination) => ({
    name: destination.name ?? null,
    address: destination.address,
    type: destination.type ?? null,
    split: coerceNumber(destination.split) ?? null,
    fee:
      destination.fee === undefined || destination.fee === null
        ? null
        : Boolean(destination.fee),
    custom_key: destination.customKey ?? null,
    custom_value: destination.customValue ?? null,
  })) ?? [];

  return {
    remoteId,
    guid,
    data,
    transcripts,
    persons,
    soundbites,
    socialInteractions,
    valueDestinations,
  };
};

export class PodcastService {
  constructor(
    private readonly client: PodcastIndexClient,
    private readonly db: PrismaClient,
  ) {}

  async search(term: string) {
    return this.client.searchPodcasts(term);
  }

  async syncPodcastByFeedId(feedId: number): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByFeedId(feedId);
    if (!feed) {
      return null;
    }

    const normalized = normalizeFeedPayload(feed);
    const client = this.db as any;

    const podcast = await client.podcast.upsert({
      where: { podcast_index_id: feed.id },
      create: normalized.createData,
      update: normalized.updateData,
    });

    await this.syncPodcastCategories(podcast.id, normalized.categories);
    await this.syncPodcastValueDestinations(
      podcast.id,
      normalized.valueDestinations,
    );

    const episodes = await this.syncEpisodes(podcast.id, feed.id);

    return {
      podcast,
      episodeDelta: episodes.length,
      episodes,
    };
  }

  async syncPodcastByGuid(guid: string): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByGuid(guid);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id);
  }

  async syncPodcastByFeedUrl(url: string): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByFeedUrl(url);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id);
  }

  async addPodcastByFeedUrl(url: string): Promise<PodcastSyncResult | null> {
    const feed = await this.client.addByFeedUrl(url);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id);
  }

  private async syncPodcastCategories(
    podcastId: number,
    categories: { id: number; name: string }[],
  ) {
    const client = this.db as any;
    await client.podcastCategory.deleteMany({ where: { podcast_id: podcastId } });

    if (!categories.length) {
      return;
    }

    await client.category.createMany({
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
      skipDuplicates: true,
    });

    await client.podcastCategory.createMany({
      data: categories.map((category) => ({
        podcast_id: podcastId,
        category_id: category.id,
      })),
    });
  }

  private async syncPodcastValueDestinations(
    podcastId: number,
    valueDestinations: {
      name: string | null;
      address: string;
      type: string | null;
      split: number | null;
      fee: boolean | null;
      custom_key: string | null;
      custom_value: string | null;
    }[],
  ) {
    const client = this.db as any;
    await client.podcastValueDestination.deleteMany({
      where: { podcast_id: podcastId },
    });

    if (!valueDestinations.length) {
      return;
    }

    await client.podcastValueDestination.createMany({
      data: valueDestinations
        .filter((destination) => destination.address)
        .map((destination) => ({
          podcast_id: podcastId,
          ...destination,
        })),
    });
  }

  private async syncEpisodes(
    podcastId: number,
    feedId: number,
  ): Promise<any[]> {
    const client = this.db as any;
    const cursor = await client.syncCursor.findUnique({
      where: { id: `feed:${feedId}` },
    });

    const since = cursor ? Number(cursor.cursor) : undefined;
    const items = await this.client.episodesByFeedId(feedId, {
      max: 1000,
      since,
    });

    if (!items.length) {
      return [];
    }

    const episodes: any[] = [];
    for (const item of items) {
      const episode = await this.upsertEpisode(podcastId, item);
      episodes.push(episode);
    }

    const newest = items
      .map((item) => coerceNumber(item.date_published ?? item.datePublished))
      .filter((value): value is number => value !== undefined)
      .reduce((max, value) => Math.max(max, value), since ?? 0);

    if (newest > (since ?? 0)) {
      await client.syncCursor.upsert({
        where: { id: `feed:${feedId}` },
        create: { id: `feed:${feedId}`, cursor: String(newest) },
        update: { cursor: String(newest) },
      });
    }

    return episodes;
  }

  private async upsertEpisode(
    podcastId: number,
    item: EpisodeDetail,
  ): Promise<any> {
    const client = this.db as any;
    const normalized = normalizeEpisodePayload(item);

    const where = normalized.remoteId
      ? { podcast_index_id: normalized.remoteId }
      : {
          podcast_id_guid: {
            podcast_id: podcastId,
            guid: normalized.guid,
          },
        };

    const createData = {
      podcast_id: podcastId,
      podcast_index_id: normalized.remoteId ?? null,
      guid: normalized.guid,
      ...normalized.data,
    };

    const updateData = {
      podcast_index_id: normalized.remoteId ?? null,
      guid: normalized.guid,
      ...normalized.data,
    };

    const episode = await client.episode.upsert({
      where,
      create: createData,
      update: updateData,
    });

    await this.syncEpisodeRelations(episode.id, normalized);
    return episode;
  }

  private async syncEpisodeRelations(
    episodeId: number,
    normalized: NormalizedEpisodePayload,
  ) {
    const client = this.db as any;

    await client.episodeTranscript.deleteMany({
      where: { episode_id: episodeId },
    });
    if (normalized.transcripts.length) {
      await client.episodeTranscript.createMany({
        data: normalized.transcripts.map((transcript) => ({
          episode_id: episodeId,
          ...transcript,
        })),
      });
    }

    await client.episodePerson.deleteMany({ where: { episode_id: episodeId } });
    if (normalized.persons.length) {
      await client.episodePerson.createMany({
        data: normalized.persons.map((person) => ({
          episode_id: episodeId,
          ...person,
        })),
      });
    }

    await client.episodeSoundbite.deleteMany({ where: { episode_id: episodeId } });
    if (normalized.soundbites.length) {
      await client.episodeSoundbite.createMany({
        data: normalized.soundbites.map((soundbite) => ({
          episode_id: episodeId,
          ...soundbite,
        })),
      });
    }

    await client.episodeSocialInteraction.deleteMany({
      where: { episode_id: episodeId },
    });
    if (normalized.socialInteractions.length) {
      await client.episodeSocialInteraction.createMany({
        data: normalized.socialInteractions.map((interaction) => ({
          episode_id: episodeId,
          ...interaction,
        })),
      });
    }

    await client.episodeValueDestination.deleteMany({
      where: { episode_id: episodeId },
    });
    if (normalized.valueDestinations.length) {
      await client.episodeValueDestination.createMany({
        data: normalized.valueDestinations.map((destination) => ({
          episode_id: episodeId,
          ...destination,
        })),
      });
    }
  }
}
