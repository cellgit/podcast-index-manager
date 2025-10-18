export type DiscoveryFunding = {
  url?: string;
  message?: string;
} | null;

export type DiscoveryItem = {
  key: string;
  feedId?: number;
  title: string;
  description?: string;
  url?: string;
  link?: string;
  image?: string;
  author?: string;
  language?: string | null;
  medium?: string | null;
  categories: string[];
  newestItemTimestamp?: number | null;
  guid?: string | null;
  explicit?: boolean | null;
  episodeCount?: number | null;
  itunesId?: number | null;
  lastUpdateTimestamp?: number | null;
  createdTimestamp?: number | null;
  popularity?: number | null;
  trendScore?: number | null;
  priority?: number | null;
  hasValue?: boolean;
  valueDestinationsCount?: number | null;
  valueModelType?: string | null;
  funding?: DiscoveryFunding;
  detailIdentity?: string | null;
};
