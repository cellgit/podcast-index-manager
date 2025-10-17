# PodcastIndex Schema Gap Analysis

> Source reference: `prd/prd_schema_result.md` (PodcastIndex official endpoints).
> Current implementation reference: `prisma/schema.prisma`.

## Feed (Podcast) Entity

| Official Field | Present? | Prisma Field | Notes / Action |
| --- | --- | --- | --- |
| `id` | ✅ | `podcast_index_id` | Stored as optional int; should be required for tracked feeds. |
| `podcastGuid` | ✅ | `podcast_guid` | Already unique; keep. |
| `title` | ✅ | `title` | |
| `url` | ✅ | `feed_url` | Should be required; add index. |
| `originalUrl` | ❌ | – | Add `original_feed_url` (nullable string). |
| `link` | ✅ | `website_url` | Rename or alias? consider `site_url`. |
| `description` | ✅ | `description` | |
| `author` | ✅ | `author` | |
| `ownerName` | ✅ | `owner_name` | Missing owner email; optional. |
| `image` | ✅ | `image` | |
| `artwork` | ✅ | `artwork` | |
| `lastUpdateTime` | ✅ | `last_update_time` | Currently DateTime; good. |
| `lastCrawlTime` | ✅ | `last_crawl_time` | |
| `lastParseTime` | ✅ | `last_parse_time` | |
| `lastGoodHttpStatusTime` | ❌ | – | Add `last_good_http_status_time` (DateTime). |
| `lastHttpStatus` | ❌ | – | Add `last_http_status` (Int). |
| `contentType` | ❌ | – | Add `content_type` (string). |
| `itunesId` | ❌ | – | Add `itunes_id` (BigInt). |
| `itunesType` | ❌ | – | Add `itunes_type` (string). |
| `generator` | ❌ | – | Add `generator` (string). |
| `language` | ✅ | `language` | Currently varchar(32); fine. |
| `explicit` | ✅ | `explicit` | boolean; consistent. |
| `type` | ❌ | – | Add `feed_type` (small int: 0/1). |
| `medium` | ✅ | `medium` | Varchar(32); fine. |
| `dead` | ❌ | – | Add `dead` (Boolean/Int). |
| `episodeCount` | ✅ | `episode_count` | Keep int. |
| `crawlErrors` | ❌ | – | Add `crawl_errors` (Int). |
| `parseErrors` | ❌ | – | Add `parse_errors` (Int). |
| `categories` | ✅ | `categories` (Json) | Consider normalized join table for filtering. |
| `locked` | ✅ | `locked` | boolean. |
| `imageUrlHash` | ❌ | – | Add `image_url_hash` (BigInt). |
| `newestItemPubdate` | ✅ | `newest_item_published` | |
| `value` | ✅ | `value` (Json) | Should be normalized for per-destination splits eventually. |
| `funding` | ✅ | `funding` (Json) | Consider dedicated table for search. |
| `popularity` (trending/badge) | ❌ | – | Add optional `popularity` for endpoints that expose it. |
| `inPollingQueue`, `priority`, `createdOn` | ❌ | – | Useful for admin; add if using batch endpoints. |

## Episode Entity

| Official Field | Present? | Prisma Field | Notes |
| --- | --- | --- | --- |
| `id` | ✅ | `podcast_index_id` | Stored as BigInt; OK. |
| `title` | ✅ | `title` | |
| `link` | ✅ | `link` | |
| `description` | ✅ | `description` | |
| `guid` | ✅ | `guid` | Unique per podcast. |
| `datePublished` | ✅ | `date_published` | |
| `datePublishedPretty` | ❌ | – | UI formatting only; compute at query. |
| `dateCrawled` | ✅ | `date_crawled` | |
| `enclosureUrl` | ✅ | `enclosure_url` | |
| `enclosureType` | ✅ | `enclosure_type` | |
| `enclosureLength` | ✅ | `enclosure_length` | Int. |
| `duration` | ✅ | `duration` | |
| `explicit` | ✅ | `explicit` | boolean (convert from API int). |
| `episode` | ✅ | `episode` | |
| `episodeType` | ❌ | – | Add `episode_type` (enum). |
| `season` | ✅ | `season` | |
| `image` | ✅ | `image` | |
| `chaptersUrl` | ✅ | `chapters_url` | |
| `transcriptUrl` | ✅ | `transcript_url` | Only single string; should support list. |
| `transcripts[]` | ❌ | – | Add dependent relation `EpisodeTranscript`. |
| `persons[]` | ✅ | `persons` (Json) | Consider normalized `EpisodePerson`. |
| `socialInteract[]` | ✅ | `social_interact` (Json) | Could normalize for filtering. |
| `value` | ✅ | `value` | |
| `soundbite` / `soundbites[]` | ❌ | – | Add JSON or relation. |
| `feed*` snapshots (author, language, etc.) | ❌ | – | Optional denormalized columns for analytics. |
| `chapters` object (JSON) | ❌ | – | Evaluate if storing parsed data separately. |

## Supporting Entities

| Entity | Status | Action |
| --- | --- | --- |
| `SyncLog` | ✅ | Extend to include `job_group`, `source`, `attempt` counters. |
| `SyncCursor` | ✅ | Works for incremental; consider per-endpoint cursors (`recent/data`, `recent/episodes`, etc.). |
| `Value` destinations | ❌ | – | Normalize into `ValueDestination` table for reporting. |
| `Category` lookup | ❌ | – | Import `/categories/list` into `Category` table; add many-to-many join `PodcastCategory`. |
| `Person` directory | ❌ | – | Optional: table for repeating persons. |
| `Soundbite` | ❌ | – | Add `EpisodeSoundbite` table for `recent/soundbites` ingestion. |
| `FeedStats` snapshots | ❌ | – | Consider `FeedSnapshot` table for trending/popularity/time windows. |

## API & Service Coverage Gaps

| Feature | Current Status | Notes |
| --- | --- | --- |
| Search by term | ✅ | `PodcastService.search`, `/api/podcast/search`. |
| Sync by feedId | ✅ | Present. |
| Import by URL | ✅ | Implemented (adds & syncs). |
| Sync by GUID / URL | ⚠️ | Have service methods but no API route/UI. |
| Batch sync | ❌ | Need scheduled job or admin batch endpoint. |
| Recent data ingestion | ❌ | Not implemented; required for continuous updates. |
| Value & funding display | ⚠️ | Data stored as JSON but UI lacks surface. |
| Error dashboard | ⚠️ | Sync logs exist but UI minimal; add filters, details. |

## Recommended Next Steps

1. **Expand Prisma schema** (feed + episode tables) to include missing operational fields and supporting tables (categories, transcripts, value destinations, soundbites).
2. **Generate migration** to add new columns with proper defaults.
3. **Update `PodcastService` mapping** to populate new fields & relations (normalize transcripts/destinations).
4. **Add ingestion jobs** for categories and recent updates (cron-friendly endpoints).
5. **Rebuild admin UI**: 
   - Feed detail view: show HTTP status, last sync times, value destinations.
   - Episode detail: transcripts, persons, soundbites, social interactions.
   - Sync log board with filters.
6. **Testing**: add Vitest coverage for service mapping & new API routes.

This document will evolve as we finalize the redesigned data model and user flows.
