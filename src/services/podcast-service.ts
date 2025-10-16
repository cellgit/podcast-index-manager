import type { PrismaClient } from "@prisma/client";
import { Episode, Podcast } from "@prisma/client";
import type { EpisodeDetail, PodcastIndexClient } from "@/lib/podcast-index";

const toDate = (value?: number | null) =>
  value ? new Date(value * 1000) : undefined;

type PodcastSyncResult = {
  podcast: Podcast;
  episodeDelta: number;
  episodes: Episode[];
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

    const podcast = await this.db.podcast.upsert({
      where: {
        podcast_index_id: feed.id,
      },
      create: {
        podcast_index_id: feed.id,
        podcast_guid: feed.podcast_guid ?? undefined,
        title: feed.title,
        feed_url: feed.url,
        website_url: feed.link ?? undefined,
        description: feed.description ?? undefined,
        author: feed.author ?? undefined,
        owner_name: feed.owner_name ?? undefined,
        image: feed.image ?? undefined,
        artwork: feed.artwork ?? undefined,
        language: feed.language ?? undefined,
        categories: feed.categories ?? undefined,
        last_update_time: toDate(feed.last_update_time),
        last_crawl_time: toDate(feed.last_crawl_time),
        last_parse_time: toDate(feed.last_parse_time),
        newest_item_published: toDate(feed.newest_item_publish_time),
        episode_count: feed.episode_count ?? undefined,
        explicit: feed.explicit ?? undefined,
        medium: feed.medium ?? undefined,
        locked: feed.locked != null ? Boolean(feed.locked) : undefined,
        funding: feed.funding ?? undefined,
        value: feed.value ?? undefined,
      },
      update: {
        podcast_guid: feed.podcast_guid ?? undefined,
        title: feed.title,
        feed_url: feed.url,
        website_url: feed.link ?? undefined,
        description: feed.description ?? undefined,
        author: feed.author ?? undefined,
        owner_name: feed.owner_name ?? undefined,
        image: feed.image ?? undefined,
        artwork: feed.artwork ?? undefined,
        language: feed.language ?? undefined,
        categories: feed.categories ?? undefined,
        last_update_time: toDate(feed.last_update_time),
        last_crawl_time: toDate(feed.last_crawl_time),
        last_parse_time: toDate(feed.last_parse_time),
        newest_item_published: toDate(feed.newest_item_publish_time),
        episode_count: feed.episode_count ?? undefined,
        explicit: feed.explicit ?? undefined,
        medium: feed.medium ?? undefined,
        locked: feed.locked != null ? Boolean(feed.locked) : undefined,
        funding: feed.funding ?? undefined,
        value: feed.value ?? undefined,
      },
    });

    const episodes = await this.syncEpisodes(podcast.id, feed.id);

    return {
      podcast,
      episodeDelta: episodes.length,
      episodes,
    };
  }

  private async syncEpisodes(podcastId: number, feedId: number) {
    const cursor = await this.db.syncCursor.findUnique({
      where: { id: `feed:${feedId}` },
    });

    const since = cursor ? Number(cursor.cursor) : undefined;

    // Fetch episodes with pagination support
    let allItems: EpisodeDetail[] = [];
    let hasMore = true;
    const batchSize = 1000;

    // For first sync or updates, fetch in batches
    while (hasMore && allItems.length < batchSize) {
      const items = await this.client.episodesByFeedId(feedId, {
        max: 1000,
        since,
      });

      if (!items.length) {
        hasMore = false;
        break;
      }

      allItems = allItems.concat(items);

      // Check if we got fewer items than requested, indicating end of data
      if (items.length < 1000) {
        hasMore = false;
      }
    }

    if (!allItems.length) {
      return [] as Episode[];
    }

    // Get existing episodes to check for duplicates
    const existingGuids = new Set(
      (await this.db.episode.findMany({
        where: { podcast_id: podcastId },
        select: { guid: true, podcast_index_id: true },
      })).map((e) => e.guid || `pi-${e.podcast_index_id}`)
    );

    // Filter out duplicates before upserting
    const newItems = allItems.filter((item) => {
      const identifier = item.guid || `pi-${item.id}`;
      return !existingGuids.has(identifier);
    });

    // Upsert episodes in batches to avoid overwhelming the database
    const upserts: Episode[] = [];
    const upsertBatchSize = 100;

    for (let i = 0; i < newItems.length; i += upsertBatchSize) {
      const batch = newItems.slice(i, i + upsertBatchSize);
      const batchResults = await Promise.all(
        batch.map((item) => this.upsertEpisode(podcastId, item)),
      );
      upserts.push(...batchResults);
    }

    // Update cursor to newest episode timestamp
    const newest = allItems
      .map((item) => item.date_published ?? 0)
      .filter(Boolean)
      .reduce((max, value) => Math.max(max, value), since ?? 0);

    if (newest > (since ?? 0)) {
      await this.db.syncCursor.upsert({
        where: { id: `feed:${feedId}` },
        create: { id: `feed:${feedId}`, cursor: String(newest) },
        update: { cursor: String(newest) },
      });
    }

    return upserts;
  }

  private async upsertEpisode(podcastId: number, item: EpisodeDetail) {
    // Try to find existing episode by podcast_index_id first, then by guid
    const existing = await this.db.episode.findFirst({
      where: {
        OR: [
          { podcast_index_id: item.id },
          item.guid ? { podcast_id: podcastId, guid: item.guid } : { id: -1 },
        ],
      },
    });

    if (existing) {
      return this.db.episode.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          description: item.description ?? undefined,
          link: item.link ?? undefined,
          enclosure_url: item.enclosure_url ?? undefined,
          enclosure_type: item.enclosure_type ?? undefined,
          enclosure_length: item.enclosure_length ?? undefined,
          duration: item.duration ?? undefined,
          explicit: Boolean(item.explicit),
          image: item.image ?? undefined,
          season: item.season ?? undefined,
          episode: item.episode ?? undefined,
          transcript_url: item.transcript_url ?? undefined,
          chapters_url: item.chapters_url ?? undefined,
          persons: item.persons ?? undefined,
          social_interact: item.social_interact ?? undefined,
          value: item.value ?? undefined,
          date_published: toDate(item.date_published),
          date_crawled: toDate(item.date_crawled),
          podcast_index_id: item.id,
          guid: item.guid ?? `pi-${item.id}`,
        },
      });
    }

    return this.db.episode.create({
      data: {
        podcast_id: podcastId,
        podcast_index_id: item.id,
        guid: item.guid ?? `pi-${item.id}`,
        title: item.title,
        description: item.description ?? undefined,
        link: item.link ?? undefined,
        enclosure_url: item.enclosure_url ?? undefined,
        enclosure_type: item.enclosure_type ?? undefined,
        enclosure_length: item.enclosure_length ?? undefined,
        duration: item.duration ?? undefined,
        explicit: Boolean(item.explicit),
        image: item.image ?? undefined,
        season: item.season ?? undefined,
        episode: item.episode ?? undefined,
        transcript_url: item.transcript_url ?? undefined,
        chapters_url: item.chapters_url ?? undefined,
        persons: item.persons ?? undefined,
        social_interact: item.social_interact ?? undefined,
        value: item.value ?? undefined,
        date_published: toDate(item.date_published),
        date_crawled: toDate(item.date_crawled),
      },
    });
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
}
