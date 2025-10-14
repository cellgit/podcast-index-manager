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
        podcastIndexId: feed.id,
      },
      create: {
        podcastIndexId: feed.id,
        podcastGuid: feed.podcastGuid ?? undefined,
        title: feed.title,
        feedUrl: feed.url,
        websiteUrl: feed.link ?? undefined,
        description: feed.description ?? undefined,
        author: feed.author ?? undefined,
        ownerName: feed.ownerName ?? undefined,
        image: feed.image ?? undefined,
        artwork: feed.artwork ?? undefined,
        language: feed.language ?? undefined,
        categories: feed.categories ?? undefined,
        lastUpdateTime: toDate(feed.lastUpdateTime),
        lastCrawlTime: toDate(feed.lastCrawlTime),
        lastParseTime: toDate(feed.lastParseTime),
        newestItemPublished: toDate(feed.newestItemPublishTime),
        episodeCount: feed.episodeCount ?? undefined,
        explicit: feed.explicit ?? undefined,
        medium: feed.medium ?? undefined,
        locked: feed.locked ?? undefined,
        funding: feed.funding ?? undefined,
        value: feed.value ?? undefined,
      },
      update: {
        podcastGuid: feed.podcastGuid ?? undefined,
        title: feed.title,
        feedUrl: feed.url,
        websiteUrl: feed.link ?? undefined,
        description: feed.description ?? undefined,
        author: feed.author ?? undefined,
        ownerName: feed.ownerName ?? undefined,
        image: feed.image ?? undefined,
        artwork: feed.artwork ?? undefined,
        language: feed.language ?? undefined,
        categories: feed.categories ?? undefined,
        lastUpdateTime: toDate(feed.lastUpdateTime),
        lastCrawlTime: toDate(feed.lastCrawlTime),
        lastParseTime: toDate(feed.lastParseTime),
        newestItemPublished: toDate(feed.newestItemPublishTime),
        episodeCount: feed.episodeCount ?? undefined,
        explicit: feed.explicit ?? undefined,
        medium: feed.medium ?? undefined,
        locked: feed.locked ?? undefined,
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
    const items = await this.client.episodesByFeedId(feedId, {
      max: 200,
      since,
    });

    if (!items.length) {
      return [] as Episode[];
    }

    const upserts = await Promise.all(
      items.map((item) => this.upsertEpisode(podcastId, item)),
    );

    const newest = items
      .map((item) => item.datePublished ?? 0)
      .filter(Boolean)
      .reduce((max, value) => Math.max(max, value), since ?? 0);

    await this.db.syncCursor.upsert({
      where: { id: `feed:${feedId}` },
      create: { id: `feed:${feedId}`, cursor: String(newest) },
      update: { cursor: String(newest) },
    });

    return upserts;
  }

  private async upsertEpisode(podcastId: number, item: EpisodeDetail) {
    return this.db.episode.upsert({
      where: {
        podcastIndexId: item.id,
      },
      create: {
        podcastId,
        podcastIndexId: item.id,
        guid: item.guid ?? undefined,
        title: item.title,
        description: item.description ?? undefined,
        link: item.link ?? undefined,
        enclosureUrl: item.enclosureUrl ?? undefined,
        enclosureType: item.enclosureType ?? undefined,
        enclosureLength: item.enclosureLength ?? undefined,
        duration: item.duration ?? undefined,
        explicit: Boolean(item.explicit),
        image: item.image ?? undefined,
        season: item.season ?? undefined,
        episode: item.episode ?? undefined,
        transcriptUrl: item.transcriptUrl ?? undefined,
        chaptersUrl: item.chaptersUrl ?? undefined,
        persons: item.persons ?? undefined,
        socialInteract: item.socialInteract ?? undefined,
        value: item.value ?? undefined,
        datePublished: toDate(item.datePublished),
        dateCrawled: toDate(item.dateCrawled),
      },
      update: {
        podcastId,
        guid: item.guid ?? undefined,
        title: item.title,
        description: item.description ?? undefined,
        link: item.link ?? undefined,
        enclosureUrl: item.enclosureUrl ?? undefined,
        enclosureType: item.enclosureType ?? undefined,
        enclosureLength: item.enclosureLength ?? undefined,
        duration: item.duration ?? undefined,
        explicit: Boolean(item.explicit),
        image: item.image ?? undefined,
        season: item.season ?? undefined,
        episode: item.episode ?? undefined,
        transcriptUrl: item.transcriptUrl ?? undefined,
        chaptersUrl: item.chaptersUrl ?? undefined,
        persons: item.persons ?? undefined,
        socialInteract: item.socialInteract ?? undefined,
        value: item.value ?? undefined,
        datePublished: toDate(item.datePublished),
        dateCrawled: toDate(item.dateCrawled),
      },
    });
  }
}
