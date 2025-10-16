import type { SearchPodcast } from "./podcast-index";

const FALLBACK_FEEDS: SearchPodcast[] = [
  {
    id: 1001,
    title: "离线示例 · 科技观测站",
    author: "示例工作室",
    description:
      "当 PodcastIndex 服务不可达时返回的本地示例数据，帮助演示控制台功能。",
    url: "https://example.com/podcasts/tech-demo/feed.xml",
    link: "https://example.com/podcasts/tech-demo",
    image: "https://example.com/podcasts/tech-demo/cover.jpg",
    episode_count: 128,
    language: "zh",
    newest_item_publish_time: 1709251200,
    categories: { "144": "Technology" },
  },
  {
    id: 1004,
    title: "Offline Demo · Kids Storytime",
    author: "Demo Network",
    description:
      "Short bedtime stories and educational fun for children. Provided as offline sample data.",
    url: "https://example.com/podcasts/kids-storytime/feed.xml",
    link: "https://example.com/podcasts/kids-storytime",
    image: "https://example.com/podcasts/kids-storytime/cover.jpg",
    episode_count: 64,
    language: "en",
    newest_item_publish_time: 1708128000,
    categories: { "117": "Kids & Family" },
  },
  {
    id: 1002,
    title: "离线示例 · 城市故事 FM",
    author: "离线播客联盟",
    description:
      "围绕城市生活、通勤与职场的故事。该数据用于控制台的离线检索体验。",
    url: "https://example.com/podcasts/city-life/feed.xml",
    link: "https://example.com/podcasts/city-life",
    image: "https://example.com/podcasts/city-life/cover.jpg",
    episode_count: 86,
    language: "zh",
    newest_item_publish_time: 1708819200,
    categories: { "132": "Society & Culture" },
  },
  {
    id: 1005,
    title: "Offline Demo · Global News Brief",
    author: "Demo Network",
    description:
      "Daily global headlines summarised for busy professionals. Offline sample feed for testing search queries.",
    url: "https://example.com/podcasts/global-news/feed.xml",
    link: "https://example.com/podcasts/global-news",
    image: "https://example.com/podcasts/global-news/cover.jpg",
    episode_count: 210,
    language: "en",
    newest_item_publish_time: 1708992000,
    categories: { "99": "News" },
  },
  {
    id: 1003,
    title: "离线示例 · 创作者备忘录",
    author: "内容观测组",
    description:
      "记录独立创作者的访谈与实践心得。用于在离线状态下演示目录搜索。",
    url: "https://example.com/podcasts/creator-notes/feed.xml",
    link: "https://example.com/podcasts/creator-notes",
    image: "https://example.com/podcasts/creator-notes/cover.jpg",
    episode_count: 42,
    language: "zh",
    newest_item_publish_time: 1708387200,
    categories: { "140": "Business" },
  },
];

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

export function isPodcastIndexFallbackEnabled() {
  if (typeof process.env.PODCASTINDEX_FALLBACK_ENABLED === "string") {
    return process.env.PODCASTINDEX_FALLBACK_ENABLED === "true";
  }
  return process.env.NODE_ENV !== "production";
}

export function searchPodcastIndexFallback(term: string, max = 25): {
  feeds: SearchPodcast[];
  matchType: "keyword" | "default";
} {
  const keyword = normalize(term.trim());
  const matched = keyword
    ? FALLBACK_FEEDS.filter((feed) => {
        const haystack = [
          feed.title,
          feed.author,
          feed.description,
          feed.categories ? Object.values(feed.categories).join(" ") : "",
        ]
          .filter((val): val is string => Boolean(val))
          .map(normalize)
          .join(" ");
      return haystack.includes(keyword);
    })
    : [];

  if (matched.length) {
    return {
      feeds: matched.slice(0, max),
      matchType: "keyword" as const,
    };
  }

  return {
    feeds: FALLBACK_FEEDS.slice(0, max),
    matchType: "default" as const,
  };
}
