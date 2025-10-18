import { describe, expect, it } from "vitest";

import {
  normalizeEpisodePayload,
  normalizeFeedPayload,
} from "@/services/podcast-service";
import type {
  EpisodeDetail,
  PodcastFeedDetail,
} from "@/lib/podcast-index";

describe("normalizeFeedPayload", () => {
  it("maps canonical timestamps and value destinations", () => {
    const unixOldest = Math.floor(Date.UTC(2023, 4, 5, 10) / 1000);
    const unixNewest = Math.floor(Date.UTC(2023, 4, 5, 12) / 1000);
    const unixValue = Math.floor(Date.UTC(2023, 4, 5, 9) / 1000);

    const feed = {
      id: 99,
      title: "Example Feed",
      url: "https://example.com/feed.xml",
      categories: { "101": "News" },
      oldestItemPublishTime: unixOldest,
      newestItemPublishTime: unixNewest,
      valueCreatedOn: unixValue,
      value: {
        model: {
          type: "lightning",
          method: "keysend",
          suggested: "100",
        },
        destinations: [
          {
            name: "podcaster",
            address: "abc123",
            type: "node",
            split: 100,
            fee: true,
          },
        ],
      },
    } satisfies Partial<PodcastFeedDetail>;

    const normalized = normalizeFeedPayload(feed as PodcastFeedDetail);

    expect(normalized.createData.podcast_index_id).toBe(99);
    expect(normalized.createData.oldest_item_pubdate).toBeInstanceOf(Date);
    expect(
      (normalized.createData.oldest_item_pubdate as Date).toISOString(),
    ).toBe("2023-05-05T10:00:00.000Z");
    expect(
      (normalized.createData.newest_item_pubdate as Date).toISOString(),
    ).toBe("2023-05-05T12:00:00.000Z");
    expect(
      (normalized.createData.value_created_on as Date).toISOString(),
    ).toBe("2023-05-05T09:00:00.000Z");
    expect(normalized.categories).toEqual([{ id: 101, name: "News" }]);
    expect(normalized.valueDestinations).toHaveLength(1);
    expect(normalized.valueDestinations[0]).toMatchObject({
      name: "podcaster",
      address: "abc123",
      type: "node",
      split: 100,
      fee: true,
    });
  });
});

describe("normalizeEpisodePayload", () => {
  it("throws when feed id is missing", () => {
    const item = {
      id: 1,
      title: "Episode without feed",
    } satisfies Partial<EpisodeDetail>;

    expect(() => normalizeEpisodePayload(item as EpisodeDetail)).toThrow(
      /feedId/i,
    );
  });

  it("maps feed id and value_created_on timestamp", () => {
    const unixValue = Math.floor(Date.UTC(2024, 0, 1) / 1000);

    const item = {
      id: 10,
      title: "Episode with feed",
      feedId: 123,
      valueCreatedOn: unixValue,
    } satisfies Partial<EpisodeDetail>;

    const normalized = normalizeEpisodePayload(item as EpisodeDetail);

    expect(normalized.data.feed_id).toBe(123);
    expect(normalized.data.value_created_on).toBeInstanceOf(Date);
    expect(
      (normalized.data.value_created_on as Date).toISOString(),
    ).toBe("2024-01-01T00:00:00.000Z");
  });
});
