import type {
  Episode,
  Podcast,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import type {
  EpisodeDetail,
  EpisodePersonPayload,
  EpisodeSocialInteractPayload,
  EpisodeTranscriptPayload,
  PodcastFeedDetail,
  PodcastIndexClient,
} from "@/lib/podcast-index";

type PodcastSyncResult = {
  podcast: Podcast;
  episodeDelta: number;
  episodes: Episode[];
};

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const DEFAULT_EPISODE_BATCH_SIZE = 100;

type SyncPodcastOptions = {
  synchronizeEpisodes?: boolean;
  episodeSince?: number;
  episodeBatchSize?: number;
  fullEpisodeRefresh?: boolean;
};

const chunkedAll = async <T, R>(
  items: readonly T[],
  batchSize: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> => {
  if (batchSize <= 0) {
    throw new Error("batchSize must be greater than 0");
  }
  const results: R[] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    const slice = items.slice(index, index + batchSize);
    const sliceResults = await Promise.all(slice.map((item) => task(item)));
    results.push(...sliceResults);
  }
  return results;
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
  createData: Prisma.PodcastUncheckedCreateInput;
  updateData: Prisma.PodcastUncheckedUpdateInput;
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

type EpisodeBaseData = Omit<Prisma.EpisodeUncheckedCreateInput, "podcast_id">;

type NormalizedEpisodePayload = {
  remoteId?: bigint;
  guid: string;
  data: EpisodeBaseData;
  transcripts: Array<Omit<Prisma.EpisodeTranscriptCreateManyInput, "episode_id">>;
  persons: Array<Omit<Prisma.EpisodePersonCreateManyInput, "episode_id">>;
  soundbites: Array<Omit<Prisma.EpisodeSoundbiteCreateManyInput, "episode_id">>;
  socialInteractions: Array<
    Omit<Prisma.EpisodeSocialInteractionCreateManyInput, "episode_id">
  >;
  valueDestinations: Array<
    Omit<Prisma.EpisodeValueDestinationCreateManyInput, "episode_id">
  >;
};

export const normalizeFeedPayload = (
  feed: PodcastFeedDetail,
): NormalizedFeedPayload => {
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

  const data = {
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
    oldest_item_pubdate: toUnixDate(
      feed.oldest_item_pubdate ??
        feed.oldest_item_publish_time ??
        feed.oldestItemPubdate ??
        feed.oldestItemPublishTime,
    ) ?? null,
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
  } satisfies Prisma.PodcastUncheckedCreateInput;

  return {
    createData: data,
    updateData: { ...data } satisfies Prisma.PodcastUncheckedUpdateInput,
    categories,
    valueDestinations: destinations,
  };
};

export const normalizeEpisodePayload = (
  item: EpisodeDetail,
): NormalizedEpisodePayload => {
  const remoteId = toOptionalBigInt(item.id);
  const guid = coerceString(item.guid) ?? `pi-${item.id}`;
  const value = item.value ?? null;
  const feedIdCandidate =
    coerceNumber(item.feed_id ?? item.feedId) ?? coerceNumber(item.feed?.id);

  if (feedIdCandidate === null || feedIdCandidate === undefined) {
    throw new Error(
      `Episode payload缺少feedId，无法建立与Podcast的关联 (episode id: ${item.id})`,
    );
  }

  const data = {
    feed_id: feedIdCandidate,
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
    start_time: toUnixDate(extractNumeric(item.start_time ?? item.startTime)) ?? null,
    end_time: toUnixDate(extractNumeric(item.end_time ?? item.endTime)) ?? null,
    status: coerceString(item.status) ?? null,
    value_model_type: value?.model?.type ?? null,
    value_model_method: value?.model?.method ?? null,
    value_model_suggested: value?.model?.suggested ?? null,
    value_created_on:
      toUnixDate(extractNumeric(item.value_created_on ?? item.valueCreatedOn)) ?? null,
  } satisfies EpisodeBaseData;

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
      const metadata: Prisma.InputJsonValue | undefined =
        Object.keys(rest).length > 0
          ? (rest as unknown as Prisma.InputJsonValue)
          : undefined;
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

  async syncPodcastByFeedId(
    feedId: number,
    options: SyncPodcastOptions = {},
  ): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByFeedId(feedId);
    if (!feed) {
      return null;
    }

    const normalized = normalizeFeedPayload(feed);
    const podcast = await this.db.$transaction(async (tx) => {
      const upserted = await tx.podcast.upsert({
        where: { podcast_index_id: feed.id },
        create: normalized.createData,
        update: normalized.updateData,
      });

      await this.syncPodcastCategories(
        tx,
        upserted.id,
        normalized.categories,
      );
      await this.syncPodcastValueDestinations(
        tx,
        upserted.id,
        normalized.valueDestinations,
      );

      return upserted;
    });

    let episodes: Episode[] = [];
    const shouldSyncEpisodes =
      options.synchronizeEpisodes === undefined ? true : options.synchronizeEpisodes;
    if (shouldSyncEpisodes) {
      episodes = await this.syncEpisodes(podcast.id, feed.id, {
        max: options.episodeBatchSize ?? 1000,
        since: options.episodeSince,
        fullRefresh: options.fullEpisodeRefresh ?? false,
      });
    }

    return {
      podcast,
      episodeDelta: episodes.length,
      episodes,
    };
  }

  async syncPodcastByGuid(
    guid: string,
    options?: SyncPodcastOptions,
  ): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByGuid(guid);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id, options);
  }

  async syncPodcastByFeedUrl(
    url: string,
    options?: SyncPodcastOptions,
  ): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByFeedUrl(url);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id, options);
  }

  async syncPodcastByItunesId(
    itunesId: number,
    options?: SyncPodcastOptions,
  ): Promise<PodcastSyncResult | null> {
    const feed = await this.client.podcastByItunesId(itunesId);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id, options);
  }

  async addPodcastByFeedUrl(
    url: string,
    options?: SyncPodcastOptions,
  ): Promise<PodcastSyncResult | null> {
    const feed = await this.client.addByFeedUrl(url);
    if (!feed) {
      return null;
    }
    return this.syncPodcastByFeedId(feed.id, options);
  }

  async syncPodcastUsingIdentifiers(
    identifiers: {
      feedId?: number;
      feedUrl?: string;
      guid?: string;
      itunesId?: number;
    },
    options?: SyncPodcastOptions,
  ): Promise<PodcastSyncResult | null> {
    if (identifiers.feedId) {
      return this.syncPodcastByFeedId(identifiers.feedId, options);
    }
    if (identifiers.guid) {
      return this.syncPodcastByGuid(identifiers.guid, options);
    }
    if (identifiers.feedUrl) {
      return this.syncPodcastByFeedUrl(identifiers.feedUrl, options);
    }
    if (identifiers.itunesId) {
      return this.syncPodcastByItunesId(identifiers.itunesId, options);
    }
    throw new Error("至少需要提供 feedId、feedUrl、guid 或 itunesId 之一");
  }

  async syncRecentData(options: { max?: number } = {}) {
    const cursorKey = "recent:data";
    const cursor = await this.db.syncCursor.findUnique({
      where: { id: cursorKey },
    });
    const since = cursor ? Number(cursor.cursor) : undefined;

    const response = await this.client.recentData({
      max: options.max ?? 500,
      since,
    });

    const feeds = response.data?.feeds ?? [];
    const items = response.data?.items ?? [];

    const nextSince =
      response.data?.nextSince ?? (response as { nextSince?: number | null }).nextSince ?? null;
    if (nextSince) {
      await this.db.syncCursor.upsert({
        where: { id: cursorKey },
        create: { id: cursorKey, cursor: String(nextSince) },
        update: { cursor: String(nextSince) },
      });
    }

    const feedIds = new Set<number>();
    feeds.forEach((feed) => feedIds.add(feed.feedId));
    items.forEach((item) => feedIds.add(item.feedId));

    const podcastIdMap = new Map<number, number>();

    for (const feedId of feedIds) {
      let podcast = await this.db.podcast.findUnique({
        where: { podcast_index_id: feedId },
      });

      if (!podcast) {
        const result = await this.syncPodcastByFeedId(feedId, {
          synchronizeEpisodes: false,
        });
        if (!result) {
          continue;
        }
        podcast = result.podcast;
      } else {
        const refreshed = await this.syncPodcastByFeedId(feedId, {
          synchronizeEpisodes: false,
        });
        if (refreshed) {
          podcast = refreshed.podcast;
        }
      }

      podcastIdMap.set(feedId, podcast.id);
    }

    const sortedItems = [...items].sort((a, b) => a.episodeAdded - b.episodeAdded);
    let episodesProcessed = 0;

    for (const item of sortedItems) {
      const podcastId = podcastIdMap.get(item.feedId);
      if (!podcastId) {
        continue;
      }

      const detail: EpisodeDetail = {
        id: item.episodeId,
        title: item.episodeTitle ?? `Episode ${item.episodeId}`,
        description: item.episodeDescription ?? undefined,
        image: item.episodeImage ?? undefined,
        feedId: item.feedId,
        datePublished: item.episodeTimestamp,
        date_published: item.episodeTimestamp,
        dateCrawled: item.episodeAdded,
        date_crawled: item.episodeAdded,
        enclosureUrl: item.episodeEnclosureUrl ?? undefined,
        enclosureLength: item.episodeEnclosureLength ?? undefined,
        enclosureType: item.episodeEnclosureType ?? undefined,
        duration: item.episodeDuration ?? undefined,
        episodeType: item.episodeType ?? undefined,
      };

      try {
        await this.upsertEpisode(podcastId, detail);
        episodesProcessed += 1;
      } catch (error) {
        console.error("Failed to upsert recent episode", {
          feedId: item.feedId,
          episodeId: item.episodeId,
          error,
        });
      }
    }

    return {
      feedsProcessed: podcastIdMap.size,
      episodesProcessed,
      nextSince,
    };
  }

  async discoverTrending(options: { max?: number; lang?: string; cat?: string } = {}) {
    const feeds = await this.client.trendingPodcasts(options);
    return this.ensureEpisodeCounts(feeds);
  }

  async discoverRecentFeeds(options: { max?: number; since?: number; lang?: string } = {}) {
    const feeds = await this.client.recentFeeds(options);
    return this.ensureEpisodeCounts(feeds);
  }

  async discoverByMedium(options: { medium: string; max?: number; startAt?: number }) {
    const feeds = await this.client.podcastsByMedium(options);
    return this.ensureEpisodeCounts(feeds);
  }

  async discoverByTag(
    options: { tag: "podcast-value" | "podcast-valueTimeSplit"; max?: number; startAt?: number },
  ) {
    const feeds = await this.client.podcastsByTag(options);
    return this.ensureEpisodeCounts(feeds);
  }

  private async syncPodcastCategories(
    client: PrismaExecutor,
    podcastId: number,
    categories: { id: number; name: string }[],
  ) {
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
    client: PrismaExecutor,
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
    options: { since?: number; max?: number; fullRefresh?: boolean } = {},
  ): Promise<Episode[]> {
    const cursorKey = `feed:${feedId}`;
    const cursor =
      options.fullRefresh === true
        ? null
        : await this.db.syncCursor.findUnique({
            where: { id: cursorKey },
          });

    let since =
      options.fullRefresh === true
        ? options.since
        : options.since ?? (cursor ? Number(cursor.cursor) : undefined);

    const maxPerPage = Math.max(1, options.max ?? DEFAULT_EPISODE_BATCH_SIZE);
    const episodes: Episode[] = [];
    let highestTimestamp = since ?? 0;
    let iterations = 0;

    while (true) {
      const batch = await this.client.episodesByFeedId(feedId, {
        max: maxPerPage,
        since,
      });

      if (!batch.length) {
        break;
      }

      const ordered = [...batch].sort((a, b) => {
        const left = coerceNumber(a.date_published ?? a.datePublished) ?? 0;
        const right = coerceNumber(b.date_published ?? b.datePublished) ?? 0;
        return left - right;
      });

      const processed = await chunkedAll(
        ordered,
        Math.min(10, Math.max(1, Math.floor(maxPerPage / 10))),
        (item) => this.upsertEpisode(podcastId, item),
      );
      episodes.push(...processed);

      const batchMax = ordered
        .map((item) => coerceNumber(item.date_published ?? item.datePublished) ?? 0)
        .reduce((max, value) => Math.max(max, value), highestTimestamp);

      if (batchMax > highestTimestamp) {
        highestTimestamp = batchMax;
      }

      if (ordered.length < maxPerPage) {
        break;
      }

      since = batchMax;
      iterations += 1;

      if (iterations > 64) {
        console.warn("syncEpisodes迭代次数达到上限，提前结束", {
          feedId,
          since,
        });
        break;
      }

      if (options.fullRefresh) {
        // PodcastIndex 暂不支持 offset，首次导入最多获取最近 maxPerPage 条
        break;
      }
    }

    if (highestTimestamp && (!cursor || highestTimestamp > Number(cursor.cursor ?? 0))) {
      await this.db.syncCursor.upsert({
        where: { id: cursorKey },
        create: { id: cursorKey, cursor: String(highestTimestamp) },
        update: { cursor: String(highestTimestamp) },
      });
    }

    return episodes;
  }

  private async ensureEpisodeCounts<T extends EpisodeCountSource>(feeds: T[]): Promise<T[]> {
    if (!feeds.length) {
      return feeds;
    }

    const missing = feeds.filter((feed) => this.extractEpisodeCount(feed) === null);
    if (!missing.length) {
      return feeds.map((feed) => this.applyEpisodeCount(feed, this.extractEpisodeCount(feed)));
    }

    const details = await chunkedAll(missing, 5, async (feed) => {
      try {
        const detail = await this.fetchFeedDetail(feed);
        return { feed, detail };
      } catch (error) {
        console.warn("ensureEpisodeCounts: failed to fetch detail", { feed, error });
        return { feed, detail: null };
      }
    });

    const countMap = new Map<string, number>();
    for (const { feed, detail } of details) {
      if (!detail) {
        continue;
      }
      const key = this.resolveFeedKey(feed) ?? this.resolveFeedKey(detail);
      const count = this.extractEpisodeCount(detail);
      if (key && count !== null) {
        countMap.set(key, count);
      }
    }

    return feeds.map((feed) => {
      const existing = this.extractEpisodeCount(feed);
      if (existing !== null) {
        return this.applyEpisodeCount(feed, existing);
      }
      const key = this.resolveFeedKey(feed);
      if (key && countMap.has(key)) {
        return this.applyEpisodeCount(feed, countMap.get(key)!);
      }
      return feed;
    });
  }

  private async fetchFeedDetail(source: EpisodeCountSource) {
    const feedId = this.pickNumericValue(
      source.id,
      source.feedId,
      source.feed_id,
      source.podcastIndexId,
      source.podcast_index_id,
    );
    if (feedId !== null) {
      const detail = await this.client.podcastByFeedId(feedId);
      if (detail) {
        return detail;
      }
    }

    const guid = this.pickStringValue(source.podcast_guid, source.podcastGuid, source.guid);
    if (guid) {
      const detail = await this.client.podcastByGuid(guid);
      if (detail) {
        return detail;
      }
    }

    const url = this.pickStringValue(
      source.url,
      source.feedUrl,
      source.feed_url,
      source.original_url,
      source.originalUrl,
    );
    if (url) {
      const detail = await this.client.podcastByFeedUrl(url);
      if (detail) {
        return detail;
      }
    }

    const itunesId = this.pickNumericValue(
      source.itunes_id,
      source.itunesId,
      source.feedItunesId,
      source.feed_itunes_id,
    );
    if (itunesId !== null) {
      const detail = await this.client.podcastByItunesId(itunesId);
      if (detail) {
        return detail;
      }
    }

    return null;
  }

  private resolveFeedKey(
    source: EpisodeCountSource | PodcastFeedDetail | null | undefined,
  ): string | null {
    if (!source) {
      return null;
    }
    const feedId = this.pickNumericValue(
      source.id,
      source.feedId,
      source.feed_id,
      source.podcastIndexId,
      source.podcast_index_id,
    );
    if (feedId !== null) {
      return `feed:${feedId}`;
    }
    const guid = this.pickStringValue(source.podcast_guid, source.podcastGuid, source.guid);
    if (guid) {
      return `guid:${guid}`;
    }
    const url = this.pickStringValue(
      source.url,
      source.feedUrl,
      source.feed_url,
      source.original_url,
      source.originalUrl,
    );
    if (url) {
      return `url:${url}`;
    }
    const itunesId = this.pickNumericValue(
      source.itunes_id,
      source.itunesId,
      source.feedItunesId,
      source.feed_itunes_id,
    );
    if (itunesId !== null) {
      return `itunes:${itunesId}`;
    }
    return null;
  }

  private extractEpisodeCount(
    source: EpisodeCountSource | PodcastFeedDetail | null | undefined,
  ): number | null {
    if (!source) {
      return null;
    }
    const numeric = this.pickNumericValue(
      source.episode_count,
      source.episodeCount,
      (source as { episodecount?: number | string | null })?.episodecount,
      (source as { totalEpisodes?: number | string | null })?.totalEpisodes,
      (source as { items_total?: number | string | null })?.items_total,
    );
    if (numeric !== null) {
      return numeric;
    }

    const items = (source as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.length;
    }

    return null;
  }

  private applyEpisodeCount<T extends EpisodeCountSource>(feed: T, count: number | null): T {
    if (count === null) {
      return feed;
    }
    const next = { ...feed } as EpisodeCountSource;
    next.episode_count = count;
    next.episodeCount = count;
    return next as T;
  }

  private pickNumericValue(...values: Array<unknown>): number | null {
    for (const value of values) {
      const numericSource = extractNumeric(value);
      if (numericSource === undefined) {
        continue;
      }
      const numeric =
        typeof numericSource === "bigint"
          ? Number(numericSource)
          : typeof numericSource === "number"
            ? numericSource
            : Number(numericSource);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return null;
  }

  private pickStringValue(...values: Array<unknown>): string | null {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  private async upsertEpisode(
    podcastId: number,
    item: EpisodeDetail,
  ): Promise<Episode> {
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

    return this.db.$transaction(async (tx) => {
      const episode = await tx.episode.upsert({
        where,
        create: createData,
        update: updateData,
      });

      await this.syncEpisodeRelations(tx, episode.id, normalized);
      return episode;
    });
  }

  private async syncEpisodeRelations(
    client: PrismaExecutor,
    episodeId: number,
    normalized: NormalizedEpisodePayload,
  ) {
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

type EpisodeCountSource = {
  id?: number | string | null;
  feedId?: number | string | null;
  feed_id?: number | string | null;
  podcastIndexId?: number | string | null;
  podcast_index_id?: number | string | null;
  itunes_id?: number | string | null;
  itunesId?: number | string | null;
  feedItunesId?: number | string | null;
  feed_itunes_id?: number | string | null;
  url?: string | null;
  feedUrl?: string | null;
  feed_url?: string | null;
  original_url?: string | null;
  originalUrl?: string | null;
  podcast_guid?: string | null;
  podcastGuid?: string | null;
  guid?: string | null;
  episode_count?: number | string | null;
  episodeCount?: number | string | null;
};
