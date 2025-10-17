## 以下是开源播客平台接口及对应schema定义文档

# Search Podcasts
## Search Podcasts, Search Podcasts by Title, Search Episodes by Person, Search Music Podcasts
包含接口
```
get /search/byterm
- This call returns all of the feeds that match the search terms in the title, author or owner of the feed.
- Example: https://api.podcastindex.org/api/1.0/search/byterm?q=batman+university&pretty

get /search/bytitle
- This call returns all of the feeds where the title of the feed matches the search term (ignores case).
- Example "everything everywhere daily" will match the podcast Everything Everywhere Daily by "everything everywhere" will not.
- Example: https://api.podcastindex.org/api/1.0/search/bytitle?q=everything+everywhere+daily&pretty

get /search/byperson
- This call returns all of the episodes where the specified person is mentioned.
- It searches the following fields:
  - Person tags
  - Episode title
  - Episode description
  - Feed owner
  - Feed author
-Examples:
https://api.podcastindex.org/api/1.0/search/byperson?q=adam%20curry&pretty
https://api.podcastindex.org/api/1.0/search/byperson?q=Martin+Mouritzen&pretty
https://api.podcastindex.org/api/1.0/search/byperson?q=Klaus+Schwab&pretty

get /search/music/byterm
- This call returns all of the feeds that match the search terms in the title, author or owner of the where the medium is music.
- Example: https://api.podcastindex.org/api/1.0/search/music/byterm?q=able+kirby&pretty
```
以下是schema及释义
```
{
  "status": "boolean",              // API 请求状态：true 表示成功，false 表示失败

  "feeds": [                        // 播客源（Feed）数组，每个元素代表一个播客
    {
      "id": "integer",              // 内部唯一 ID（PodcastIndex 分配）
      "podcastGuid": "string",      // 全局唯一播客 GUID（来自 <podcast:guid>）
      "title": "string",            // 播客标题
      "url": "string(URL)",         // 当前 RSS 订阅地址
      "originalUrl": "string(URL)", // 原始 RSS 地址（若已迁移）
      "link": "string(URL)",        // 播客主页链接
      "description": "string",      // 播客简介（自动取最长的描述字段）
      "author": "string",           // 作者（来自 iTunes 或其他命名空间）
      "ownerName": "string",        // 拥有者名称（来自 iTunes owner 标签）
      "image": "string(URL)",       // 封面图片地址
      "artwork": "string(URL)",     // 系统挑选的最佳封面图

      "lastUpdateTime": "integer",          // 上次更新的时间戳（RSS pubDate）
      "lastCrawlTime": "integer",           // 最后一次抓取该 Feed 的时间
      "lastParseTime": "integer",           // 最后一次解析 RSS 内容的时间
      "lastGoodHttpStatusTime": "integer",  // 最近一次成功（非4xx/5xx）HTTP响应的时间
      "lastHttpStatus": "integer",          // 最近一次 HTTP 状态码（如 200, 404 等）
      "contentType": "string",              // 最近一次请求的 Content-Type（如 application/rss+xml）

      "itunesId": "integer|null",   // 对应 Apple Podcasts 的节目 ID
      "generator": "string",        // Feed 文件中的 <generator> 字段（发布工具）
      "language": "string",         // 语言代码（如 zh-CN, en-US）
      "explicit": "boolean",        // 是否包含敏感内容（explicit 标签）
      "type": "integer",            // Feed 类型：0=RSS，1=Atom
      "medium": "string",           // 媒介类型（来自 podcast:medium，如 audio、video）
      "dead": "integer",            // 是否已标记为“死亡”Feed（0=否，1=是）
      "episodeCount": "integer",    // 已知的节目数量
      "crawlErrors": "integer",     // 抓取错误次数（网络层错误）
      "parseErrors": "integer",     // 解析错误次数（XML 或编码错误）

      "categories": {               // 分类对象，键为分类ID，值为分类名称
        "68": "Technology",
        "74": "Society & Culture"
      },

      "locked": "integer",          // 是否允许导入其他平台：0=允许，1=拒绝
      "imageUrlHash": "integer",    // 图片 URL（去协议后）的 CRC32 哈希值
      "newestItemPubdate": "integer"// 最新一集节目发布时间（Unix 时间戳）
    }
  ],

  "count": "integer",               // 返回的 Feed 数量
  "query": "string",                // 搜索时的关键字
  "description": "string"           // 响应描述（通常是状态说明或错误信息）
}
```


#Search
## Search Episodes by Person
包含接口
```
get /search/byperson
- This call returns all of the episodes where the specified person is mentioned.
- It searches the following fields:
  - Person tags
  - Episode title
  - Episode description
  - Feed owner
  - Feed author
-Examples:
https://api.podcastindex.org/api/1.0/search/byperson?q=adam%20curry&pretty
https://api.podcastindex.org/api/1.0/search/byperson?q=Martin+Mouritzen&pretty
https://api.podcastindex.org/api/1.0/search/byperson?q=Klaus+Schwab&pretty
```
以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "items": [                           // 匹配到的节目（episode）列表
    {
      "id": "integer",                 // 内部唯一的 Episode ID（PodcastIndex 分配）

      "title": "string",               // 节目标题（episode 名称）
      "link": "string(URL)",           // 频道级链接（RSS <link>），通常是节目详情页
      "description": "string",         // 节目级描述（自动取 <description> / <itunes:summary> / <content:encoded> 中最长者）

      "guid": "string",                // 节目的唯一标识（RSS item <guid>）

      "datePublished": "integer",      // 发表时间（Unix 时间戳，秒）
      "dateCrawled": "integer",        // 被抓取到的时间（Unix 时间戳，秒）

      "enclosureUrl": "string(URL)",   // 媒体文件地址（音频/视频等）
      "enclosureType": "string",       // 媒体文件的 Content-Type（如 audio/mpeg, audio/mp3）
      "enclosureLength": "integer",    // 媒体文件字节长度（来自 enclosure length）

      "duration": "integer|null",      // 估算的时长（秒）。直播 liveItem 可能为 null
      "explicit": "integer",           // 是否标记为敏感内容：0=未标记，1=已标记（注意是整数，而非布尔）

      "episode": "integer|null",       // 集数编号（如 19）。无则为 null
      "episodeType": "full|trailer|bonus|null", // 节目类型（可为 null，特别是 liveItem）
      "season": "integer|null",        // 季编号（如 3）。无则为 null

      "image": "string(URL)",          // 节目级图片（item-level image）

      "feedItunesId": "integer|null",  // 对应 Feed 的 Apple Podcasts ID（若已知）
      "feedImage": "string(URL)",      // 频道级封面图（channel-level image）
      "feedId": "integer",             // 对应 Feed 的内部唯一 ID（PodcastIndex）
      "feedUrl": "string(URL)",        // 对应 Feed 的当前订阅 URL
      "feedAuthor": "string",          // 频道级作者（通常来自 iTunes 命名空间）
      "feedTitle": "string",           // 频道/播客标题（Feed 名称）
      "feedLanguage": "string",        // 频道语言代码（遵循 RSS 语言规范，如 en-us, zh-CN）

      "chaptersUrl": "string(URL)|null",   // 指向章节 JSON 的 URL（如有）
      "transcriptUrl": "string(URL)|null", // 传统单一转录文件 URL（多数情况下建议用 transcripts 列表）

      "transcripts": [                 // 转录/字幕文件列表（可能不存在或为空）
        {
          "url": "string(URL)",        // 转录文件地址
          "type": "string",            // MIME 类型（如 application/srt, text/vtt, application/json）
          "language": "string?"        // 可选：语言标记（如 en, en-US, zh-CN）
        }
      ]
    }
  ],

  "count": "integer",                  // 返回的节目条目数量
  "query": "string",                   // 查询使用的关键字
  "description": "string"              // 响应的描述（状态/提示/错误信息等）
}
```


# Podcast
## By Feed ID, By Feed URL, By iTunes ID, By GUID
包含接口
```
get /podcasts/byfeedid
- This call returns everything we know about the feed from the PodcastIndex ID
- Examples:
https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=75075&pretty
Includes value and funding: https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=169991&pretty

get /podcasts/byfeedurl
- This call returns everything we know about the feed from the feed URL
- Examples:
https://api.podcastindex.org/api/1.0/podcasts/byfeedurl?url=https://feeds.theincomparable.com/batmanuniversity&pretty
Includes value and funding: https://api.podcastindex.org/api/1.0/podcasts/byfeedurl?url=https://engineered.network/pragmatic/feed/index.xml&pretty

get /podcasts/byitunesid
- This call returns everything we know about the feed from the iTunes ID
- Example: 
https://api.podcastindex.org/api/1.0/podcasts/byitunesid?id=1441923632&pretty

get /podcasts/byguid
- This call returns everything we know about the feed from the feed's GUID.
- The GUID is a unique, global identifier for the podcast. See the namespace spec for guid for details.
- Examples:
https://api.podcastindex.org/api/1.0/podcasts/byguid?guid=9b024349-ccf0-5f69-a609-6b82873eab3c&pretty
Includes value and funding: https://api.podcastindex.org/api/1.0/podcasts/byguid?guid=9b024349-ccf0-5f69-a609-6b82873eab3c&pretty
```
以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "query": {                           // 本次请求传入的查询参数的回显对象
    // 说明：实际返回会“回显”你在请求里传入的键值。
    // 常见键包括：
    "id": "string?",                   // 示例：按 feedId 查询时回显 { id: "920666" }
    "url": "string(URL)?",             // 示例：按 feed URL 查询时回显 { url: "https://..." }
    "guid": "string?"                  // 示例：按 podcast:guid 查询时回显 { guid: "..." }
    // 注：上面键均为“可选且互斥/并存均可”，以真实传参为准
  },

  "feed": {                            // 该播客源（Feed）的详细信息
    "id": "integer",                   // PodcastIndex 内部 Feed ID（唯一）
    "podcastGuid": "string",           // <podcast:guid> 全局唯一 GUID

    "title": "string",                 // 播客标题
    "url": "string(URL)",              // 当前订阅源 URL
    "originalUrl": "string(URL)",      // 订阅源曾用 URL（迁移历史）
    "link": "string(URL)",             // 频道主页链接
    "description": "string",           // 频道级描述（取 <description>/<itunes:summary>/<content:encoded> 中较长者）

    "author": "string",                // 频道级作者（通常来自 iTunes 命名空间）
    "ownerName": "string",             // 频道拥有者名称（iTunes owner:name）
    "image": "string(URL)",            // 频道级封面图
    "artwork": "string(URL)",          // 系统判定的最佳封面图（可能与 image 相同）

    "lastUpdateTime": "integer",       // 频道最近更新时间（RSS pubDate / 启发式），Unix 秒
    "lastCrawlTime": "integer",        // 最近一次抓取时间，Unix 秒
    "lastParseTime": "integer",        // 最近一次解析时间，Unix 秒
    "lastGoodHttpStatusTime": "integer", // 最近一次成功（非 4xx/5xx）HTTP 时间，Unix 秒
    "lastHttpStatus": "integer",       // 最近抓取的 HTTP 状态码（含 9xx 内部状态）
    "contentType": "string",           // 最近抓取的 Content-Type

    "itunesId": "integer|null",        // Apple Podcasts 的节目 ID（若已知）
    "itunesType": "string?",           // iTunes 的 itunes:type（如 "episodic"），可选
    "generator": "string",             // RSS <generator>（发布工具）
    "language": "string",              // 频道语言（RSS 语言规范，如 en-us, zh-CN）

    "explicit": "boolean",             // 是否标记为敏感内容（feed 级）
    "type": "0|1",                     // 源类型：0=RSS，1=Atom
    "medium": "string?",               // podcast:medium 的值（如 audio、video），可选
    "dead": "integer",                 // 是否判定为“死亡”源（多次失败后降频抓取）

    "chash": "string?",                // 基于(title/link/feedLanguage/generator/author/ownerName/ownerEmail)的 MD5（十六进制），可选

    "episodeCount": "integer",         // 已知的节目数量
    "crawlErrors": "integer",          // 抓取错误次数（网络/HTTP 层）
    "parseErrors": "integer",          // 解析错误次数（XML/编码 等）

    "categories": {                    // 分类：键为分类 ID，值为分类名
      "104": "Tv",
      "105": "Film"
      // ...
    },

    "locked": "0|1",                   // 是否允许被其他平台导入：0=允许，1=拒绝（podcast:locked）
    "imageUrlHash": "integer?",        // 去协议后的封面 URL 的 CRC32（64 位整型），可选

    "value": {                         // “Value for Value” 支持信息（可选；可能缺失）
      "model": {
        "type": "string",              // 例如 "lightning"、"webmonetization"
        "method": "string",            // 例如 "keysend"
        "suggested": "string"          // 建议金额/单位（字符串表达）
      },
      "destinations": [
        {
          "name": "string",            // 目的地名称（如 "podcaster"）
          "address": "string",         // 地址（如 LN 节点公钥）
          "type": "string",            // 目的地类型（如 "node"）
          "split": "integer",          // 分账比例（百分比）
          "fee": "boolean",            // 是否承担手续费
          "customKey": "string?",      // 自定义键（可选）
          "customValue": "string?"     // 自定义值（可选）
        }
      ]
    },

    "funding": {                       // 捐赠/资助信息（可选；可能缺失）
      "url": "string(URL)",            // 资助页面
      "message": "string"              // 展示文案
    }
  },

  "description": "string"              // 响应描述（状态/提示/错误信息等）
}
```

## By Tag
包含接口
```
get /podcasts/bytag
- This call returns all feeds that support the specified podcast namespace tag.
- The only supported tags are:
podcast:value using the podcast-value parameter
podcast:valueTimeSplit using the podcast-valueTimeSplit parameter
Only the podcast-value or podcast-valueTimeSplit parameter should be used. If multiple are specified, the first parameter is used and the others are ignored.
- When called without a start_at value, the top 500 feeds sorted by popularity are returned in descending order.
- When called with a start_at value, the feeds are returned sorted by the feedId starting with the specified value up to the max number of feeds to return. The nextStartAt specifies the value to pass to the next start_at. Repeat this sequence until no items are returned.
- Examples:
https://api.podcastindex.org/api/1.0/podcasts/bytag?podcast-value&max=200&pretty
https://api.podcastindex.org/api/1.0/podcasts/bytag?podcast-value&max=200&start_at=1&pretty
https://api.podcastindex.org/api/1.0/podcasts/bytag?podcast-valueTimeSplit&pretty
```
以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "feeds": [                           // 符合条件的 feed 列表（数组）
    {
      "id": "integer",                 // PodcastIndex 内部 Feed ID（唯一）
      "title": "string",               // 播客名称
      "url": "string(URL)",            // 当前订阅源 URL
      "originalUrl": "string(URL)",    // 订阅源曾用 URL（迁移历史）
      "link": "string(URL)",           // 频道主页链接
      "description": "string",         // 频道级描述（取 <description>/<itunes:summary>/<content:encoded> 中较长者）
      "author": "string",              // 频道级作者（通常来自 iTunes 命名空间）
      "ownerName": "string",           // 频道拥有者名称（iTunes owner:name）
      "image": "string(URL)",          // 频道级封面图
      "artwork": "string(URL)",        // 系统判定的最佳封面图（可能与 image 相同）

      "lastUpdateTime": "integer",     // 频道级最近更新时间（RSS pubDate 或启发式推断），Unix 秒
      "lastCrawlTime": "integer",      // 最近一次抓取时间，Unix 秒
      "lastParseTime": "integer",      // 最近一次解析时间，Unix 秒
      "lastGoodHttpStatusTime": "integer", // 最近一次成功（非 4xx/5xx）HTTP 状态的时间，Unix 秒
      "lastHttpStatus": "integer",     // 最近一次抓取的 HTTP 状态码（含 9xx 内部状态）
      "contentType": "string",         // 最近一次抓取返回的 Content-Type

      "itunesId": "integer|null",      // Apple Podcasts 的节目 ID（若已知）
      "generator": "string",           // RSS <generator>（发布工具）
      "language": "string",            // 频道语言（遵循 RSS 语言规范，如 en-us, zh-CN）

      "type": "0|1",                   // 源类型：0=RSS，1=Atom
      "dead": "integer",               // 是否判定为“死亡”源（多次失败后降频抓取）
      "crawlErrors": "integer",        // 抓取错误次数（网络/HTTP 层）
      "parseErrors": "integer",        // 解析错误次数（XML/编码 等）
      
      "categories": {                  // 分类：键为分类 ID，值为分类名
        "104": "Tv",
        "105": "Film"
      },

      "locked": "0|1",                 // 是否允许被其他平台导入：0=允许，1=拒绝（podcast:locked）
      "popularity": "integer",         // 在索引中的趋势排名（热度指标，可能仅列表接口提供）
      "imageUrlHash": "integer",       // 去协议后的封面 URL 的 CRC32（64 位整型）

      "value": {                       // “Value for Value” 支持信息（可能不存在）
        "model": {
          "type": "string",            // 如 "lightning"、"webmonetization" 等
          "method": "string",          // 支付方式（如 "keysend"）
          "suggested": "string"        // 建议金额/单位（字符串表示）
        },
        "destinations": [              // 收款目的地列表
          {
            "name": "string",          // 名称（如 "podcaster"）
            "address": "string",       // 地址（如 LN 节点公钥）
            "type": "string",          // 目的地类型（如 "node"）
            "split": "integer",        // 分账比例（百分比）
            "fee": "boolean",          // 是否承担手续费
            "customKey": "string",     // 自定义键（可选）
            "customValue": "string"    // 自定义值（可选）
          }
        ]
      },

      "funding": {                     // 捐赠/资助信息（可能不存在）
        "url": "string(URL)",          // 资助页面
        "message": "string"            // 展示文案
      },

      "podcastGuid": "string",         // <podcast:guid> 的全局唯一 GUID
      "valueCreatedOn": "integer"      // 本 feed 的 value 数据被添加的时间（Unix 秒；无则为 0）
    }
  ],

  "count": "integer",                  // 本次响应返回的 feed 条数
  "total": "integer",                  // 该端点可返回的 feed 总数（用于分页/估算）
  "nextStartAt": "integer",            // 下一页的起始 Feed ID（当请求传入 start_at 时才返回）
  "description": "string"              // 响应描述（状态/提示/错误信息等）
}
```



## By Medium
包含接口
```
get /podcasts/bymedium
- This call returns all feeds marked with the specified medium tag value.
- Example: 
https://api.podcastindex.org/api/1.0/podcasts/bymedium?medium=music&pretty
```

以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "feeds": [                           // 符合条件的播客源（Feed）列表
    {
      "id": "integer",                 // 内部唯一 Feed ID（PodcastIndex 分配）
      "podcastGuid": "string",         // <podcast:guid> 的全局唯一 GUID

      "title": "string",               // 播客名称
      "url": "string(URL)",            // 当前订阅源 URL
      "originalUrl": "string(URL)",    // 订阅源曾用 URL（迁移历史）
      "link": "string(URL)",           // 频道主页链接
      "description": "string",         // 频道级描述（取 <description>/<itunes:summary>/<content:encoded> 中较长者）

      "author": "string",              // 频道级作者（通常来自 iTunes 命名空间）
      "ownerName": "string",           // 频道拥有者名称（iTunes owner:name）
      "image": "string(URL)",          // 频道级封面图
      "artwork": "string(URL)",        // 系统判定的最佳封面图（可能与 image 相同）

      "lastUpdateTime": "integer",     // 频道最近更新时间（RSS pubDate / 启发式），Unix 秒
      "lastCrawlTime": "integer",      // 最近一次抓取时间，Unix 秒
      "lastParseTime": "integer",      // 最近一次解析时间，Unix 秒
      "lastGoodHttpStatusTime": "integer", // 最近一次成功（非 4xx/5xx）HTTP 时间，Unix 秒
      "lastHttpStatus": "integer",     // 最近抓取的 HTTP 状态码（含 9xx 内部状态）
      "contentType": "string",         // 最近抓取返回的 Content-Type

      "itunesId": "integer|null",      // Apple Podcasts ID（若已知）
      "generator": "string",           // RSS <generator>（发布工具）
      "language": "string",            // 频道语言（RSS 语言规范，如 en-us, zh-CN）
      "explicit": "boolean",           // 是否标记为敏感内容（feed 级）

      "type": "0|1",                   // 源类型：0=RSS，1=Atom
      "medium": "string",              // podcast:medium 的值（如 audio、video、music 等）
      "dead": "integer",               // 是否判定为“死亡”源（多次失败后降频抓取）

      "episodeCount": "integer",       // 已知的节目数量
      "crawlErrors": "integer",        // 抓取错误次数（网络/HTTP 层）
      "parseErrors": "integer",        // 解析错误次数（XML/编码 等）

      "categories": {                  // 分类对象：键为分类 ID，值为分类名
        "104": "Tv",
        "105": "Film"
        // ...
      },

      "locked": "0|1",                 // 是否允许被其他平台导入：0=允许，1=拒绝（podcast:locked）
      "imageUrlHash": "integer",       // 去协议后的封面 URL 的 CRC32（64 位整型）
      "newestItemPubdate": "integer"   // 最新一集节目发布时间（Unix 秒）
      // 说明：有些端点使用 newestItemPublishTime，含义相同
    }
  ],

  "count": "integer",                  // 本次响应返回的 feed 条数

  "medium": "string",                  // （顶层）请求参数中的 medium 回显值（例如 "film"）
                                       // 注：这是“请求入参回显”，与 feed 内部的 podcast:medium 含义不同

  "description": "string"              // 响应描述（状态/提示/错误信息等）
}
```


## Trending
包含接口
```
get /podcasts/trending
- This call returns the podcasts/feeds that in the index that are trending.
- Example: 
https://api.podcastindex.org/api/1.0/podcasts/trending?pretty
```

以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "feeds": [                           // 匹配到的播客源（Feed）列表
    {
      "id": "integer",                 // PodcastIndex 内部唯一 Feed ID

      "url": "string(URL)",            // 当前 Feed 订阅地址
      "title": "string",               // 播客名称

      "description": "string",         // 频道级描述（取 <description> / <itunes:summary> / <content:encoded> 中最长者）
      "author": "string",              // 作者信息（通常来自 iTunes 命名空间）
      "image": "string(URL)",          // Feed 封面图（频道级 <image>）
      "artwork": "string(URL)",        // 最佳封面图（可能与 image 相同）

      "newestItemPublishTime": "integer", // 最新节目发布时间（Unix 时间戳，单位秒）
                                          // 说明：部分接口字段名为 newestItemPubdate，意义相同。

      "itunesId": "integer|null",      // Apple Podcasts 的 Feed ID（若已知）
      "trendScore": "integer",         // 趋势分数，用于反映播客在索引中的热度排名

      "language": "string",            // Feed 语言（遵循 RSS Language 规范，如 en-us、zh-CN）

      "categories": {                  // 分类对象：键为分类 ID，值为分类名
        "104": "Tv",
        "105": "Film",
        "107": "Reviews"
      }
    }
  ],

  "count": "integer",                  // 返回的 Feed 数量
  "max": "integer|null",               // 请求参数 max 的回显（若有）
  "since": "integer|null",             // 请求参数 since 的回显（若有）

  "description": "string"              // 响应描述（状态/提示信息等）
}
```


## Dead
包含接口
```
get /podcasts/dead
- This call returns all feeds that have been marked dead (dead == 1)
- Hourly statistics can also be access at https://public.podcastindex.org/podcastindex_dead_feeds.csv For details, see Dead Feeds.
- Example:
https://api.podcastindex.org/api/1.0/podcasts/dead?pretty
```

以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "feeds": [                           // 匹配到的 feed 列表
    {
      "id": "integer",                 // PodcastIndex 内部唯一 Feed ID
      "title": "string",               // 播客名称
      "url": "string(URL)",            // 当前 Feed 订阅地址

      "duplicateOf": "integer|null"    // 若此 Feed 为重复项，则指向主 Feed 的 ID；
                                       // 否则为 null。仅在 /podcasts/dead 等端点出现。
    }
  ],

  "count": "integer",                  // 返回的 feed 数量
  "description": "string"              // 响应描述（例如 "Found matching feed"）
}
```


## Batch By Feed GUID
包含接口
```
post /podcasts/batch/byguid
- This call returns everything we know about the feed from the feed's GUID provided in JSON array in the body of the request.
- The GUID is a unique, global identifier for the podcast. See the namespace spec for guid for details.
```

以下是schema及释义
```
{
  "status": "boolean",                 // API 请求状态：true=成功，false=失败

  "allFound": "boolean",               // 是否为所有 podcastguid 和 episodeguid 值都找到了匹配数据
  "found": "integer",                  // 找到的 feed 数量

  "feeds": [                           // 匹配到的播客 feed 列表
    {
      "id": "integer",                 // PodcastIndex 内部唯一 Feed ID
      "title": "string",               // 播客名称
      "url": "string(URL)",            // 当前 Feed URL
      "originalUrl": "string(URL)",    // Feed 曾经使用的 URL（迁移历史）
      "link": "string(URL)",           // 播客主页链接

      "description": "string",         // 播客频道级描述
                                       // 取自 <description> / <itunes:summary> / <content:encoded> 中最长者

      "author": "string",              // 作者信息（通常来自 iTunes）
      "ownerName": "string",           // 拥有者名称（通常 iTunes owner:name）

      "image": "string(URL)",          // 频道级封面图
      "artwork": "string(URL)",        // 系统选出的最佳封面图（可能与 image 相同）

      "lastUpdateTime": "integer",     // 最后一次更新时间（RSS pubDate 或启发式值），单位秒
      "lastCrawlTime": "integer",      // 最近一次抓取时间，单位秒
      "lastParseTime": "integer",      // 最近一次解析时间，单位秒

      "inPollingQueue": "integer|null",// 是否当前在轮询队列中（用于抓取新节目）
      "priority": "integer",           // 抓取优先级：-1 表示不抓取；5 表示最高频抓取
                                       // Allowed: -1┃0┃1┃2┃3┃4┃5

      "lastGoodHttpStatusTime": "integer", // 最近一次成功（非 4xx/5xx）HTTP 响应时间
      "lastHttpStatus": "integer",     // 最近一次抓取时的 HTTP 状态码（可能出现 9xx 内部状态）
      "contentType": "string",         // 最近抓取时的 Content-Type

      "itunesId": "integer|null",      // Apple Podcasts 的 Feed ID（若已知）
      "generator": "string",           // RSS <generator> 元素（生成器名称）

      "createdOn": "integer",          // Feed 首次被 PodcastIndex 收录的时间（Unix 秒）

      "language": "string",            // 频道语言（如 en-us、zh-CN）
      "type": "0|1",                   // 源类型：0=RSS，1=Atom
      "dead": "integer",               // 是否标记为“死亡”源（过多错误后降低抓取频率）

      "crawlErrors": "integer",        // 抓取错误次数（HTTP 层面）
      "parseErrors": "integer",        // 解析错误次数（XML/字符集）

      "categories": {                  // 分类对象：键为分类 ID，值为分类名
        "104": "Tv",
        "105": "Film",
        "107": "Reviews"
      },

      "locked": "0|1",                 // 是否允许被其他平台导入：0=允许，1=拒绝（podcast:locked）
      "explicit": "boolean",           // 是否标记为敏感内容
      "podcastGuid": "string",         // 播客全局唯一 GUID（来自 <podcast:guid>）

      "medium": "string",              // 节目媒介类型（podcast:medium，例如 music, video, podcast 等）
      "episodeCount": "integer",       // 已收录的节目数量
      "imageUrlHash": "integer",       // 封面 URL（去协议部分）经 CRC32 计算的哈希值（64 位）

      "newestItemPubdate": "integer",  // 最新节目发布时间（Unix 秒）
                                       // 注意：有些端点使用 newestItemPublishTime，含义相同

      "valueBlock": "string"           // Value-for-Value 支持信息（JSON 字符串）
                                       // 包含播客打赏/闪电网络/WebMonetization 等方式的元数据
                                       // 示例：
                                       // lightning: https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=169991&pretty
                                       // webmonetization: https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=779873&pretty
    }
  ],

  "description": "string"              // 响应描述（例如 'Found matching feed'）
}
```