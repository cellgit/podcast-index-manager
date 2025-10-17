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
        "68": "Technology",         // 示例：分类 ID 68 -> Technology
        "74": "Society & Culture" // 示例：分类 ID 74 -> Society & Culture
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
      "104": "Tv",                 // 示例：分类 ID 104 -> Tv
      "105": "Film"               // 示例：分类 ID 105 -> Film
      // ...
    },

    "locked": "0|1",                   // 是否允许被其他平台导入：0=允许，1=拒绝（podcast:locked）
    "imageUrlHash": "integer?",        // 去协议后的封面 URL 的 CRC32（64 位整型），可选

    "value": {                         // “Value for Value” 支持信息（可选；可能缺失）
      "model": {                      // Value-for-Value 模型定义
        "type": "string",              // 例如 "lightning"、"webmonetization"
        "method": "string",            // 例如 "keysend"
        "suggested": "string"          // 建议金额/单位（字符串表达）
      },
      "destinations": [             // Value-for-Value 分账配置列表
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
        "104": "Tv",                 // 示例：分类 ID 104 -> Tv
        "105": "Film"               // 示例：分类 ID 105 -> Film
      },

      "locked": "0|1",                 // 是否允许被其他平台导入：0=允许，1=拒绝（podcast:locked）
      "popularity": "integer",         // 在索引中的趋势排名（热度指标，可能仅列表接口提供）
      "imageUrlHash": "integer",       // 去协议后的封面 URL 的 CRC32（64 位整型）

      "value": {                       // “Value for Value” 支持信息（可能不存在）
        "model": {                      // Value-for-Value 模型定义
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
        "104": "Tv",                 // 示例：分类 ID 104 -> Tv
        "105": "Film"               // 示例：分类 ID 105 -> Film
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
        "104": "Tv",                 // 示例：分类 ID 104 -> Tv
        "105": "Film",               // 示例：分类 ID 105 -> Film
        "107": "Reviews"           // 示例：分类 ID 107 -> Reviews
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
        "104": "Tv",                 // 示例：分类 ID 104 -> Tv
        "105": "Film",               // 示例：分类 ID 105 -> Film
        "107": "Reviews"           // 示例：分类 ID 107 -> Reviews
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

# Add
## Add Podcast by Feed URL
包含接口
```
get /add/byfeedurl
- 将指定的 RSS 订阅 URL 加入 PodcastIndex。如果该订阅已存在，则直接返回其 Feed ID。
- 需要具备写权限的 API Key。
- 可选参数：`chash`（内容指纹，用于去重）、`itunesid` 辅助匹配。

post /add/byfeedurl
- 与 GET 语义相同，适合在不便暴露查询参数的场景。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "feedId": "integer|null",         // 新增或已存在的 Feed 内部 ID；仅 byfeedurl 返回
  "existed": "boolean|null",        // 订阅是否已存在：true=已存在；仅 byfeedurl 返回
  "description": "string"           // 文本说明，如 "Feed queued for crawling"
}
```

## Add Podcast by iTunes ID
包含接口
```
get /add/byitunesid
- 通过 Apple Podcasts 的节目 ID 请求抓取指定订阅。
- 需要具备写权限的 API Key。

post /add/byitunesid
- 与 GET 语义相同，使用 POST 传参。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "description": "string"           // 文本说明，如 "Feed queued for crawling" 或错误信息
}
```

# Apple Replacement
## iTunes Search/Lookup 替代接口
包含接口
```
get /search
- 兼容 Apple Search API 的查询入口，返回 PodcastIndex 数据。
- 示例：https://api.podcastindex.org/search?term=batman （无需 API Key）

get /lookup
- 兼容 Apple Lookup API 的节目查询入口。
- 可通过 `id`、`bundleId`、`upc` 等 iTunes 兼容参数查询（无需 API Key）。
```
以下是schema及释义
```
{
  "resultCount": "integer",          // 命中的条目数量
  "results": [                       // Apple 风格的返回对象数组
    {
      "artistName": "string",             // 作者/发布者名称
      "artworkUrl30": "string(URL)",      // 30px 封面（PodcastIndex 实际返回原始图）
      "artworkUrl60": "string(URL)",      // 60px 封面
      "artworkUrl100": "string(URL)",     // 100px 封面
      "artworkUrl600": "string(URL)",     // 600px 封面
      "collectionId": "integer",          // iTunes Feed ID
      "collectionName": "string",         // 节目名称
      "collectionCensoredName": "string", // 经过审查的节目名称（若有屏蔽词）
      "collectionExplicitness": "explicit|cleaned", // 节目是否显式标记露骨内容
      "collectionPrice": "integer",       // Apple 返回的节目价格（恒为 0）
      "collectionHdPrice": "integer",     // Apple 返回的 HD 价格（恒为 0）
      "collectionViewUrl": "string(URL)", // Apple 网站上的节目详情页

      "trackId": "integer",               // iTunes Track ID（等同于 Feed ID）
      "trackName": "string",              // 节目标题
      "trackCensoredName": "string",      // 经过审查的标题
      "trackExplicitness": "explicit|cleaned", // 节目显式标记
      "trackPrice": "integer",            // 节目价格（恒为 0）
      "trackHdPrice": "integer",          // HD 价格（恒为 0）
      "trackHdRentalPrice": "integer",    // HD 租赁价格（恒为 0）
      "trackRentalPrice": "integer",      // 租赁价格（恒为 0）
      "trackCount": "integer",            // 已收录的节目数
      "trackViewUrl": "string(URL)",      // Apple Track 详情页

      "feedUrl": "string(URL)",           // 当前 RSS 订阅地址
      "primaryGenreName": "string",       // 主分类名称
      "genres": ["string"],               // 所属分类名称列表
      "genreIds": ["integer"],            // 分类 ID 列表（Apple 风格）
      "country": "string",               // 国家/地区（目前固定为 "USA"）
      "currency": "string",              // 价格币种（固定 "USD"）
      "releaseDate": "string",           // 数据生成时间（ISO8601）
      "kind": "string",                  // 媒体类型，固定 "podcast"
      "wrapperType": "string",           // 包装类型，固定 "track"
      "contentAdvisoryRating": "Clean|Explicit", // 内容评级标签

      "artworkUrl": "string(URL)",        // PodcastIndex 兼容字段：原始封面
      "artistId": "integer|null",         // 可能的 iTunes 作者 ID（若提供）
      "artistViewUrl": "string(URL)?",    // iTunes 作者主页
      "collectionArtistId": "integer|null", // iTunes 聚合作者 ID
      "collectionArtistViewUrl": "string(URL)?", // 聚合作者主页
      "previewUrl": "string(URL)?",       // Apple 预览链接（多数为空）

      "itunesId": "integer",              // PodcastIndex 回填的 iTunes ID（与 collectionId 相同）
      "podcastGuid": "string?",           // 对应 Podcast GUID（若索引中存在）
      "language": "string?",              // RSS 语言编码（如 en-us）
      "description": "string?",           // 播客简介
      "author": "string?",                // iTunes author 字段
      "image": "string(URL)?"             // 频道级封面
    }
  ]
}
```

# Categories
## List Categories
包含接口
```
get /categories/list
- 返回 PodcastIndex 支持的全部分类 ID 与名称。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态
  "feeds": [                        // 分类列表
    {
      "id": "integer",             // 分类 ID（数值）
      "name": "string"             // 分类名称（英文）
    }
  ],
  "count": "integer",              // 分类总数
  "description": "string"          // 响应说明，如 "Categories list"
}
```
# Episodes
## Episodes by Feed (ID / URL / iTunes ID / Podcast GUID)
包含接口
```
get /episodes/byfeedid
- 按内部 Feed ID 获取节目列表，可一次传入多个 ID。
- 额外返回 `liveItems`（若该 Feed 当前有 <podcast:liveItem> 信息）。

get /episodes/byfeedurl
- 通过 RSS 订阅 URL 获取节目列表。

get /episodes/byitunesid
- 通过 Apple Podcasts 节目 ID 获取节目列表。

get /episodes/bypodcastguid
- 通过 <podcast:guid> 获取节目列表。
```
以下是schema及释义
```
{
  "status": "boolean",                // 接口调用状态
  "liveItems": [                       // （仅 byfeedid）当前正在直播/预告的节目列表，可为空
    {
      "id": "integer",                // 节目内部 ID
      "title": "string",              // 标题
      "link": "string(URL)",          // 节目详情页
      "description": "string",        // 节目简介
      "guid": "string",               // RSS <guid>
      "datePublished": "integer",     // 发布时间（Unix 秒）
      "datePublishedPretty": "string",// 人类可读时间
      "dateCrawled": "integer",       // 被索引抓取时间
      "enclosureUrl": "string(URL)",  // 媒体文件 URL
      "enclosureType": "string",      // 媒体 MIME 类型（如 audio/mpeg）
      "enclosureLength": "integer",   // 媒体文件大小（字节）
      "startTime": "integer",         // 直播开始时间（Unix 秒）
      "endTime": "integer",           // 直播结束时间（Unix 秒，可能为 0）
      "status": "live|ended",         // 直播状态
      "contentLink": "string(URL)?",  // 主播提供的外部播放链接（若有）
      "duration": "integer|null",     // 时长（秒），直播可能为空
      "explicit": "integer",          // 是否标记为露骨：0/1
      "episode": "integer|null",      // 集数编号
      "episodeType": "full|trailer|bonus|null", // 节目类型
      "season": "integer|null",       // 所属季
      "image": "string(URL)",         // 节目级图片
      "feedItunesId": "integer|null", // 对应 Feed 的 iTunes ID
      "feedImage": "string(URL)",     // Feed 封面
      "feedId": "integer",            // Feed 内部 ID
      "feedLanguage": "string",       // Feed 语言
      "feedDead": "integer",          // Feed 是否标记为死亡 0/1
      "feedDuplicateOf": "integer|null", // 若为重复 Feed，指向主 Feed ID
      "chaptersUrl": "string(URL)|null", // 章节 JSON
      "transcriptUrl": "string(URL)|null" // 旧版 transcript 链接
    }
  ],
  "items": [                           // 节目列表（EpisodeItem）
    {
      "id": "integer",                // 节目内部 ID
      "title": "string",              // 标题
      "link": "string(URL)",          // 节目详情页
      "description": "string",        // 节目简介
      "guid": "string",               // RSS <guid>
      "datePublished": "integer",     // 发布时间（Unix 秒）
      "datePublishedPretty": "string",// 格式化时间
      "dateCrawled": "integer",       // 索引抓取时间
      "enclosureUrl": "string(URL)",  // 媒体文件 URL
      "enclosureType": "string",      // 媒体 MIME 类型
      "enclosureLength": "integer",   // 媒体大小（字节）
      "duration": "integer|null",     // 节目时长（秒）
      "explicit": "integer",          // 是否露骨内容：0/1
      "episode": "integer|null",      // 集数编号
      "episodeType": "full|trailer|bonus|null", // 节目类型
      "season": "integer|null",       // 季编号
      "image": "string(URL)",         // 节目级图片
      "feedItunesId": "integer|null", // Feed 的 iTunes ID
      "feedUrl": "string(URL)",       // Feed 当前订阅 URL
      "feedImage": "string(URL)",     // Feed 封面
      "feedId": "integer",            // Feed 内部 ID
      "feedTitle": "string",          // Feed 标题
      "feedAuthor": "string?",        // Feed 作者（若索引存在）
      "feedLanguage": "string",       // Feed 语言
      "feedDead": "integer?",         // Feed 是否死亡 0/1（仅部分端点返回）
      "feedDuplicateOf": "integer|null", // 若为重复 Feed，指向主 Feed ID
      "podcastGuid": "string?",       // <podcast:guid>
      "chaptersUrl": "string(URL)|null", // 章节 JSON
      "transcriptUrl": "string(URL)|null", // 传统 transcript 链接
      "transcripts": [                 // 多格式 transcript 列表，可为空
        {
          "url": "string(URL)",       // 转录文件 URL
          "type": "string"            // MIME 类型（如 text/vtt、application/json）
        }
      ],
      "soundbite": "object|null",     // 单个 soundbite（startTime/duration/title）
      "soundbites": [                  // 多个 soundbite，可选
        {
          "startTime": "integer",     // 起始秒数
          "duration": "integer",      // 片段时长（秒）
          "title": "string"           // 片段标题
        }
      ],
      "persons": [                     // 参与人员列表（<podcast:person>）
        {
          "id": "integer",            // PodcastIndex 人员 ID
          "name": "string",           // 姓名
          "role": "string",           // 角色（遵循 Podcast Taxonomy）
          "group": "string",          // 角色分组（如 Cast、Production）
          "href": "string(URL)?",     // 人员资料链接
          "img": "string(URL)?"       // 人员头像
        }
      ],
      "socialInteract": [              // 评论/社交互动入口列表
        {
          "url": "string(URL)",       // 根帖地址
          "protocol": "disabled|activitypub|twitter|lightning", // 协议类型
          "accountId": "string?",     // 该帖作者在平台的账号 ID
          "accountUrl": "string(URL)?", // 账号主页 URL
          "priority": "integer"       // 多条目时的优先级（越小越优先）
        }
      ],
      "value": {                       // Value for Value 支持信息，可缺失
        "model": {                      // Value-for-Value 模型定义
          "type": "string",           // 价值网络类型，如 lightning/webmonetization
          "method": "string",         // 传输方式，如 keysend
          "suggested": "string"       // 建议金额（字符串）
        },
        "destinations": [             // Value-for-Value 分账配置列表
          {
            "name": "string",         // 分账角色名称，如 podcaster
            "address": "string",      // 支付地址，如 LN 公钥
            "type": "string",         // 目的地类型，例如 node/paymentPointer
            "split": "integer",       // 分账比例（百分比）
            "fee": "boolean",         // 是否承担手续费
            "customKey": "string?",   // 自定义键
            "customValue": "string?"  // 自定义值
          }
        ]
      }
    }
  ],
  "count": "integer",                // 返回的节目条数
  "query": "mixed",                   // 请求回显：可能是单个 ID、ID 数组或 {url:..., guid:...}
  "description": "string"             // 响应说明
}
```

## Episode by GUID
包含接口
```
get /episodes/byguid
- 根据 Feed GUID + Episode GUID 找到唯一节目。
- 支持仅传 episode GUID（全局唯一时）。
```
以下是schema及释义
```
{
  "status": "boolean",                // 调用状态
  "id": "integer|null",               // 请求中传入的 feedId（若有）回显
  "url": "string(URL)?",              // 请求中传入的 feedUrl 回显
  "podcastGuid": "string?",           // 请求中传入的 podcastGuid 回显
  "guid": "string",                   // 请求中的节目 GUID 回显
  "episode": {                         // EpisodeItem 字段同上
    "id": "integer",                // 节目内部 ID
    "title": "string",              // 标题
    "link": "string(URL)",          // 节目详情页
    "description": "string",        // 节目简介
    "guid": "string",               // RSS <guid>
    "datePublished": "integer",     // 发布时间（Unix 秒）
    "datePublishedPretty": "string",// 格式化时间
    "dateCrawled": "integer",       // 索引抓取时间
    "enclosureUrl": "string(URL)",  // 媒体文件 URL
    "enclosureType": "string",      // 媒体 MIME 类型
    "enclosureLength": "integer",   // 媒体大小（字节）
    "duration": "integer|null",     // 节目时长（秒）
    "explicit": "integer",          // 是否露骨内容：0/1
    "episode": "integer|null",      // 集数编号
    "episodeType": "full|trailer|bonus|null", // 节目类型
    "season": "integer|null",       // 季编号
    "image": "string(URL)",         // 节目级图片
    "feedItunesId": "integer|null", // Feed 的 iTunes ID
    "feedUrl": "string(URL)",       // Feed 当前订阅 URL
    "feedImage": "string(URL)",     // Feed 封面
    "feedId": "integer",            // Feed 内部 ID
    "feedTitle": "string",          // Feed 标题
    "feedAuthor": "string?",        // Feed 作者（若索引存在）
    "feedLanguage": "string",       // Feed 语言
    "feedDead": "integer?",         // Feed 是否死亡 0/1（仅部分端点返回）
    "feedDuplicateOf": "integer|null", // 若为重复 Feed，指向主 Feed ID
    "podcastGuid": "string?",       // <podcast:guid>
    "chaptersUrl": "string(URL)|null", // 章节 JSON
    "transcriptUrl": "string(URL)|null", // 传统 transcript 链接
    "transcripts": [                 // 多格式 transcript 列表，可为空
      {
        "url": "string(URL)",       // 转录文件 URL
        "type": "string"            // MIME 类型（如 text/vtt、application/json）
      }
    ],
    "soundbite": "object|null",     // 单个 soundbite（startTime/duration/title）
    "soundbites": [                  // 多个 soundbite，可选
      {
        "startTime": "integer",     // 起始秒数
        "duration": "integer",      // 片段时长（秒）
        "title": "string"           // 片段标题
      }
    ],
    "persons": [                     // 参与人员列表（<podcast:person>）
      {
        "id": "integer",            // PodcastIndex 人员 ID
        "name": "string",           // 姓名
        "role": "string",           // 角色（遵循 Podcast Taxonomy）
        "group": "string",          // 角色分组（如 Cast、Production）
        "href": "string(URL)?",     // 人员资料链接
        "img": "string(URL)?"       // 人员头像
      }
    ],
    "socialInteract": [              // 评论/社交互动入口列表
      {
        "url": "string(URL)",       // 根帖地址
        "protocol": "disabled|activitypub|twitter|lightning", // 协议类型
        "accountId": "string?",     // 该帖作者在平台的账号 ID
        "accountUrl": "string(URL)?", // 账号主页 URL
        "priority": "integer"       // 多条目时的优先级（越小越优先）
      }
    ],
    "value": {                       // Value for Value 支持信息，可缺失
      "model": {                      // Value-for-Value 模型定义
        "type": "string",           // 价值网络类型，如 lightning/webmonetization
        "method": "string",         // 传输方式，如 keysend
        "suggested": "string"       // 建议金额（字符串）
      },
      "destinations": [             // Value-for-Value 分账配置列表
        {
          "name": "string",         // 分账角色名称，如 podcaster
          "address": "string",      // 支付地址，如 LN 公钥
          "type": "string",         // 目的地类型，例如 node/paymentPointer
          "split": "integer",       // 分账比例（百分比）
          "fee": "boolean",         // 是否承担手续费
          "customKey": "string?",   // 自定义键
          "customValue": "string?"  // 自定义值
        }
      ]
    }
  },
  "description": "string"             // 响应说明
}
```

## Episode by Internal ID
包含接口
```
get /episodes/byid
- 使用 PodcastIndex 节目 ID 获取完整详情。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "id": "integer",                    // 查询的节目 ID 回显
  "episode": {                         // EpisodeItem 扩展版
    "id": "integer",       // 节目内部 ID
    "title": "string",       // 节目标题
    "link": "string(URL)",       // 节目详情页
    "description": "string",       // 节目简介
    "guid": "string",       // 节目 GUID
    "datePublished": "integer",       // 发布时间（Unix 秒）
    "datePublishedPretty": "string",       // 发布时间（可读字符串）
    "dateCrawled": "integer",       // 被索引抓取时间（Unix 秒）
    "enclosureUrl": "string(URL)",       // 媒体文件 URL
    "enclosureType": "string",       // 媒体 MIME 类型
    "enclosureLength": "integer",       // 媒体文件大小（字节）
    "duration": "integer|null",       // 节目时长（秒）
    "explicit": "integer",       // 露骨内容标记：0=否，1=是
    "episode": "integer|null",       // 集数编号
    "episodeType": "full|trailer|bonus|null",       // 节目类型（full/trailer/bonus 等）
    "season": "integer|null",       // 所属季编号
    "image": "string(URL)",       // 节目级图片 URL
    "imageUrlHash": "integer|null",     // 节目级图片 CRC32（去协议）
    "feedItunesId": "integer|null",       // 对应 Feed 的 Apple Podcasts ID
    "feedImage": "string(URL)",       // Feed 封面图 URL
    "feedImageUrlHash": "integer|null", // Feed 图片 CRC32
    "feedId": "integer",       // Feed 内部 ID
    "feedTitle": "string",       // Feed 标题
    "feedLanguage": "string",       // Feed 语言（ISO 代码）
    "chaptersUrl": "string(URL)|null",       // 章节 JSON 文件 URL
    "transcripts": [                 // 多格式 transcript 列表，可为空
      {
        "url": "string(URL)",       // 转录文件 URL
        "type": "string"            // MIME 类型（如 text/vtt、application/json）
      }
    ],
    "persons": [                     // 参与人员列表（<podcast:person>）
      {
        "id": "integer",            // PodcastIndex 人员 ID
        "name": "string",           // 姓名
        "role": "string",           // 角色（遵循 Podcast Taxonomy）
        "group": "string",          // 角色分组（如 Cast、Production）
        "href": "string(URL)?",     // 人员资料链接
        "img": "string(URL)?"       // 人员头像
      }
    ],
    "socialInteract": [              // 评论/社交互动入口列表
      {
        "url": "string(URL)",       // 根帖地址
        "protocol": "disabled|activitypub|twitter|lightning", // 协议类型
        "accountId": "string?",     // 帖子作者账号 ID
        "accountUrl": "string(URL)?", // 账号主页 URL
        "priority": "integer"       // 多条目时的优先级（越小越优先）
      }
    ],
    "value": {                       // Value for Value 支持信息，可缺失
      "model": {                      // Value-for-Value 模型定义
        "type": "string",               // 付款类型（如 lightning、webmonetization）
        "method": "string",             // 付款方式（如 keysend、lnurl）
        "suggested": "string"           // 建议的每秒打赏金额（单位依赖 type）
      },
      "destinations": [             // 收款分账列表
        {
          "name": "string",             // 分账目标名称（如 podcaster）
          "address": "string",          // 接收付款的节点/地址
          "type": "string",             // 分账目标类型（如 node、paymentPointer）
          "split": "integer",           // 应分配的百分比分成
          "fee": "boolean",             // 是否因手续费需求而加入该目标
          "customKey": "string?",       // 可选：随付款发送的自定义记录键名
          "customValue": "string?"      // 可选：与 customKey 对应的自定义记录值
        }
      ]
    },
    "soundbite": "object|null",     // 单个 soundbite（startTime/duration/title）
    "soundbites": [                  // 多个 soundbite，可选
      {
        "startTime": "integer",       // 片段起始秒数（秒）
        "duration": "integer",       // 片段时长（秒）
        "title": "string"       // 片段标题
      }
    ]
  },
  "description": "string"          // 响应描述或状态说明
}
```

## Live Episodes
包含接口
```
get /episodes/live
- 返回所有正在进行或即将开始的直播节目 (podcast:liveItem)。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "items": [                          // LiveItem 列表，结构同上 liveItems 元素
    {
      "id": "integer",                // 节目内部 ID
      "title": "string",              // 标题
      "link": "string(URL)",          // 节目详情页
      "description": "string",        // 节目简介
      "guid": "string",               // RSS <guid>
      "datePublished": "integer",     // 发布时间（Unix 秒）
      "datePublishedPretty": "string",// 人类可读时间
      "dateCrawled": "integer",       // 被索引抓取时间
      "enclosureUrl": "string(URL)",  // 媒体文件 URL
      "enclosureType": "string",      // 媒体 MIME 类型
      "enclosureLength": "integer",   // 媒体文件大小（字节）
      "startTime": "integer",         // 直播开始时间（Unix 秒）
      "endTime": "integer",           // 直播结束时间（Unix 秒，可能为 0）
      "status": "live|ended",         // 直播状态
      "contentLink": "string(URL)?",  // 主播提供的外部播放链接（若有）
      "duration": "integer|null",     // 时长（秒），直播可能为空
      "explicit": "integer",          // 是否标记为露骨：0/1
      "episode": "integer|null",      // 集数编号
      "episodeType": "full|trailer|bonus|null", // 节目类型
      "season": "integer|null",       // 所属季
      "image": "string(URL)",         // 节目级图片
      "feedItunesId": "integer|null", // 对应 Feed 的 iTunes ID
      "feedImage": "string(URL)",     // Feed 封面
      "feedId": "integer",            // Feed 内部 ID
      "feedLanguage": "string",       // Feed 语言
      "feedDead": "integer",          // Feed 是否标记为死亡 0/1
      "feedDuplicateOf": "integer|null", // 若为重复 Feed，指向主 Feed ID
      "chaptersUrl": "string(URL)|null", // 章节 JSON
      "transcriptUrl": "string(URL)|null" // 旧版 transcript 链接
    }
  ],
  "count": "integer",                // 返回数量
  "max": "integer|null",             // 请求中 max 参数的回显
  "description": "string"          // 响应描述或状态说明
}
```

## Random Episodes
包含接口
```
get /episodes/random
- 返回随机节目列表，支持 `max` 指定条数（默认 1，最大 100）。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "episodes": [                       // 随机节目列表（字段与 EpisodeItem 接近）
    {
      "id": "integer",       // 节目内部 ID
      "title": "string",       // 节目标题
      "link": "string(URL)",       // 节目详情页
      "description": "string",       // 节目简介
      "guid": "string",       // 节目 GUID
      "datePublished": "integer",       // 发布时间（Unix 秒）
      "datePublishedPretty": "string",       // 发布时间（可读字符串）
      "dateCrawled": "integer",       // 被索引抓取时间（Unix 秒）
      "enclosureUrl": "string(URL)",       // 媒体文件 URL
      "enclosureType": "string",       // 媒体 MIME 类型
      "enclosureLength": "integer",       // 媒体文件大小（字节）
      "explicit": "integer",       // 露骨内容标记：0=否，1=是
      "episode": "integer|null",       // 集数编号
      "episodeType": "string|null",       // 节目类型（full/trailer/bonus 等）
      "season": "integer|null",       // 所属季编号
      "image": "string(URL)",       // 节目级图片 URL
      "feedItunesId": "integer|null",       // 对应 Feed 的 Apple Podcasts ID
      "feedImage": "string(URL)",       // Feed 封面图 URL
      "feedId": "integer",       // Feed 内部 ID
      "feedTitle": "string",       // Feed 标题
      "feedLanguage": "string",       // Feed 语言（ISO 代码）
      "categories": { "categoryId": "string" }, // 分类映射
      "chaptersUrl": "string(URL)|null"       // 章节 JSON 文件 URL
    }
  ],
  "count": "integer",                // 实际返回数量
  "max": "integer",                  // 请求的 max 参数回显
  "description": "string"          // 响应描述或状态说明
}
```
# Hub
## PubNotify
包含接口
```
get /hub/pubnotify
- 通知索引某个 Feed 已更新。支持通过 `id` 或 `url` 指定目标。
- 无需 API Key，适合在发布系统中直接调用。
```
以下是schema及释义
```
{
  "status": "boolean",              // 调用状态
  "description": "string"           // 提示信息，如 "Feed update queued"
}
```

# Recent
## Recent Data Snapshot
包含接口
```
get /recent/data
- 返回从指定 `since` 起的增量抓取信息，包含 Feed 与 Episode 两类数据。
- 默认窗口约 60 秒，可通过 `max` & `since` 翻页。
```
以下是schema及释义
```
{
  "status": "boolean",              // 调用状态
  "feedCount": "integer",           // 本次响应包含的 Feed 数量
  "itemCount": "integer",           // 本次响应包含的 Episode 数量
  "max": "integer|null",            // 请求中 max 参数回显
  "since": "integer",               // 请求起始时间（Unix 秒）回显
  "nextSince": "integer",           // 下一页使用的 since（Unix 秒）
  "description": "string",          // 响应描述
  "data": {       // 增量数据块（包含 feeds 与 items 列表）
    "position": "integer",          // 数据指针，可用于校验连续性
    "feeds": [                       // 新增/更新的 Feed 列表
      {
        "feedId": "integer",        // Feed 内部 ID
        "feedUrl": "string(URL)",   // Feed 当前订阅 URL
        "feedTitle": "string",      // Feed 标题
        "feedDescription": "string",// Feed 描述
        "feedImage": "string(URL)", // Feed 封面
        "feedLanguage": "string",   // Feed 语言
        "feedItunesId": "integer|null" // Feed 的 Apple ID（若已知）
      }
    ],
    "items": [                      // 新增 Episode 列表
      {
        "episodeId": "integer",    // Episode 内部 ID
        "episodeTitle": "string",  // 节目标题
        "episodeDescription": "string", // 节目简介
        "episodeImage": "string(URL)", // 节目图片
        "episodeTimestamp": "integer", // 节目发布时间（Unix 秒）
        "episodeAdded": "integer",      // 加入索引时间（Unix 秒）
        "episodeEnclosureUrl": "string(URL)",    // 媒体文件 URL
        "episodeEnclosureLength": "integer",     // 媒体文件大小（字节）
        "episodeEnclosureType": "string",        // 媒体 MIME 类型
        "episodeDuration": "integer|null",       // 时长（秒）
        "episodeType": "full|trailer|bonus|null",// 节目类型
        "feedId": "integer"          // 所属 Feed ID
      }
    ]
  }
}
```

## Recent Episodes
包含接口
```
get /recent/episodes
- 返回最近更新的节目列表，按发布时间倒序。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "items": [                        // 最近节目列表
    {
      "id": "integer",                // 节目内部 ID
      "title": "string",              // 节目标题
      "link": "string(URL)",          // 节目详情页
      "description": "string",        // 节目简介
      "guid": "string",               // 节目 GUID
      "datePublished": "integer",     // 发布时间（Unix 秒）
      "datePublishedPretty": "string",// 人类可读时间
      "dateCrawled": "integer",       // 被索引抓取时间
      "enclosureUrl": "string(URL)",  // 媒体文件 URL
      "enclosureType": "string",      // 媒体 MIME 类型
      "enclosureLength": "integer",   // 媒体文件大小
      "explicit": "integer",          // 是否标记露骨（0/1）
      "episode": "integer|null",      // 集数编号
      "episodeType": "full|trailer|bonus|null", // 节目类型
      "season": "integer|null",       // 季编号
      "image": "string(URL)",         // 节目级图片
      "feedItunesId": "integer|null", // Feed 的 iTunes ID
      "feedImage": "string(URL)",     // Feed 封面
      "feedId": "integer",            // Feed 内部 ID
      "feedTitle": "string",          // Feed 标题
      "feedLanguage": "string"        // Feed 语言
    }
  ],
  "count": "integer",                // 返回的节目数量
  "max": "integer|null",             // 请求中 max 参数回显
  "description": "string"          // 响应描述或状态说明
}
```

## Recent Feeds
包含接口
```
get /recent/feeds
- 返回近期更新过节目的 Feed。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "feeds": [                         // Feed 列表
    {
      "id": "integer",              // Feed 内部 ID
      "url": "string(URL)",         // 订阅 URL
      "title": "string",            // Feed 标题
      "newestItemPublishTime": "integer", // 最新节目发布时间（Unix 秒）
      "oldestItemPublishTime": "integer", // 最旧节目发布时间（Unix 秒）
      "itunesId": "integer|null",   // iTunes ID
      "language": "string",         // Feed 语言
      "categories": {                // 分类映射：分类 ID -> 名称
        "104": "string"             // 示例：分类 ID 104 -> 分类名称
      }
    }
  ],
  "count": "integer",                // Feed 数量
  "max": "integer|null",             // 请求 max 回显
  "since": "integer|null",           // 请求 since 回显
  "description": "string"          // 响应描述或状态说明
}
```

## Newly Indexed Feeds
包含接口
```
get /recent/newfeeds
- 返回最近新增到索引的 Feed（按抓取时间）。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "feeds": [       // Feed 列表
    {
      "id": "integer",              // Feed 内部 ID
      "url": "string(URL)",         // 订阅 URL
      "image": "string(URL)",       // 封面图
      "timeAdded": "integer",       // 加入索引时间（Unix 秒）
      "status": "integer",          // 抓取状态码（0=正常）
      "contentHash": "string",      // 内容哈希（用于去重）
      "language": "string"          // Feed 语言
    }
  ],
  "count": "integer",                // Feed 数量
  "max": "integer|null",             // 请求 max 回显
  "description": "string"          // 响应描述或状态说明
}
```

## Newly Value-enabled Feeds
包含接口
```
get /recent/newvaluefeeds
- 返回最近新增 Value for Value 支持的 Feed。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "feeds": [       // Feed 列表
    {
      "id": "integer",              // Feed 内部 ID
      "url": "string(URL)",         // 订阅 URL
      "title": "string",            // Feed 标题
      "author": "string",           // Feed 作者
      "image": "string(URL)",       // 封面
      "newestItemPublishTime": "integer", // 最新节目发布时间
      "itunesId": "integer|null",   // iTunes ID
      "trendScore": "integer",      // 热度评分
      "language": "string",         // 语言
      "categories": {                // 分类映射
        "104": "string"             // 示例：分类 ID 104 -> 分类名称
      }
    }
  ],
  "count": "integer",       // 返回条目数量
  "max": "integer|null",       // 请求参数 max 的回显值
  "since": "integer|null",       // 请求参数 since 的回显值
  "description": "string"          // 响应描述或状态说明
}
```

## Recent Soundbites
包含接口
```
get /recent/soundbites
- 返回最近收录的 soundbite 片段。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "items": [                        // soundbite 列表
    {
      "enclosureUrl": "string(URL)", // 对应节目媒体 URL
      "title": "string",             // 片段标题
      "startTime": "integer",        // 起始秒数
      "duration": "integer",         // 时长（秒）
      "episodeId": "integer",        // 节目 ID
      "episodeTitle": "string",      // 节目标题
      "feedTitle": "string",         // Feed 标题
      "feedUrl": "string(URL)",      // Feed URL
      "feedId": "integer"            // Feed ID
    }
  ],
  "count": "integer",                // 返回数量
  "description": "string"          // 响应描述或状态说明
}
```

# Static Data
## Tracking Snapshot (24h Window)
包含接口
```
get /static/tracking/current
- 返回近 24 小时新增/更新的数据，与 /recent/data 相似但静态托管。
- 可通过 `previousTrackingUrl` 继续向前翻页。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "feedCount": "integer",       // 响应中返回的 Feed 数量
  "itemCount": "integer",       // 响应中返回的 Episode 数量
  "max": "integer|null",       // 请求参数 max 的回显值
  "since": "integer",       // 请求参数 since 的回显值
  "previousTrackingUrl": "string(URL)", // 上一段历史数据的下载地址
  "data": {       // 增量数据块（包含 feeds 与 items 列表）
    "nextSince": "integer",         // 下一段数据的 since（Unix 秒）
    "position": "integer",          // 数据指针
    "feeds": [                       // 结构同 Recent Data Snapshot
      {
        "feedId": "integer",       // Feed 内部 ID
        "feedUrl": "string(URL)",       // Feed 当前订阅 URL
        "feedTitle": "string",       // Feed 标题
        "feedDescription": "string",       // Feed 描述（频道简介）
        "feedImage": "string(URL)",       // Feed 封面图 URL
        "feedLanguage": "string",       // Feed 语言（ISO 代码）
        "feedItunesId": "integer|null"       // 对应 Feed 的 Apple Podcasts ID
      }
    ],
    "items": [                      // 结构同 Recent Data Snapshot
      {
        "episodeId": "integer",       // 节目内部 ID
        "episodeTitle": "string",       // 节目标题
        "episodeDescription": "string",       // 节目简介
        "episodeImage": "string(URL)",       // 节目图片 URL
        "episodeTimestamp": "integer",       // 节目发布时间（Unix 秒）
        "episodeAdded": "integer",       // 节目被索引时间（Unix 秒）
        "episodeEnclosureUrl": "string(URL)",       // 节目媒体文件 URL
        "episodeEnclosureLength": "integer",       // 节目媒体文件大小（字节）
        "episodeEnclosureType": "string",       // 节目媒体 MIME 类型
        "episodeDuration": "integer|null",       // 节目时长（秒）
        "episodeType": "full|trailer|bonus|null",       // 节目类型（full/trailer/bonus 等）
        "feedId": "integer"       // Feed 内部 ID
      }
    ]
  }
}
```

## Tracking Value Block Feeds
包含接口
```
get /static/tracking/feedValueBlocks
- 返回最近新增 Value for Value 配置的 Feed 列表。
```
以下是schema及释义
```
[
  {
    "id": "integer",                // Feed 内部 ID
    "itunesId": "integer|null",     // iTunes ID
    "podcastGuid": "string",        // <podcast:guid>
    "url": "string(URL)",           // Feed 订阅 URL
    "value": {                       // Value for Value 信息（结构同前述 value）
      "model": {                      // Value-for-Value 模型定义
        "type": "string",               // 付款类型（如 lightning、webmonetization）
        "method": "string",             // 付款方式（如 keysend、lnurl）
        "suggested": "string"           // 建议的每秒打赏金额（单位依赖 type）
      },
      "destinations": [             // 收款分账列表
        {
          "name": "string",             // 分账目标名称（如 podcaster）
          "address": "string",          // 接收付款的节点/地址
          "type": "string",             // 分账目标类型（如 node、paymentPointer）
          "split": "integer",           // 应分配的百分比分成
          "fee": "boolean",             // 是否因手续费需求而加入该目标
          "customKey": "string?",       // 可选：随付款发送的自定义记录键名
          "customValue": "string?"      // 可选：与 customKey 对应的自定义记录值
        }
      ]
    },
    "valueCreatedOn": "integer"     // 首次发现 value 的时间（Unix 秒）
  }
]
```

## Tracking Value Block Episodes
包含接口
```
get /static/tracking/episodeValueBlocks
- 返回最近新增 Value for Value 配置的节目列表。
```
以下是schema及释义
```
[
  {
    "episodeGuid": "string",        // 节目 GUID
    "episodeId": "integer",         // 节目内部 ID
    "feedId": "integer",            // Feed ID
    "feedUrl": "string(URL)",       // Feed URL
    "itunesId": "integer|null",     // Feed iTunes ID
    "podcastGuid": "string",        // Feed GUID
    "value": {       // Value-for-Value 配置对象
      "model": {                      // Value-for-Value 模型定义
        "type": "string",               // 付款类型（如 lightning、webmonetization）
        "method": "string",             // 付款方式（如 keysend、lnurl）
        "suggested": "string"           // 建议的每秒打赏金额（单位依赖 type）
      },
      "destinations": [             // 收款分账列表
        {
          "name": "string",             // 分账目标名称（如 podcaster）
          "address": "string",          // 接收付款的节点/地址
          "type": "string",             // 分账目标类型（如 node、paymentPointer）
          "split": "integer",           // 应分配的百分比分成
          "fee": "boolean",             // 是否因手续费需求而加入该目标
          "customKey": "string?",       // 可选：随付款发送的自定义记录键名
          "customValue": "string?"      // 可选：与 customKey 对应的自定义记录值
        }
      ]
    }
  },                  // Value for Value 信息
    "valueCreatedOn": "integer"     // 首次发现 Value 的时间
  }
]
```

## Public Dumps
包含接口
```
get /static/public/podcastindex_dead_feeds.csv
- 返回被标记为 "dead" 的 Feed ID 列表（CSV，单列）。

get /static/public/podcastindex_feeds.db.tgz
- 下载 PodcastIndex Feed 数据库（SQLite，gzip 压缩）。
```
返回内容为静态文件，无 JSON schema，可直接下载保存。

## Stats Aggregates (chart/daily/hourly)
包含接口
```
get /static/stats/chart-data.json
get /static/stats/daily_counts.json
get /static/stats/hourly_counts.json
- 三个接口返回相同结构的全量统计快照。
```
以下是schema及释义
```
{
  "feedCountTotal": "integer",              // 索引中的 Feed 总数
  "episodeCountTotal": "integer",           // 索引中的 Episode 总数
  "feedsWithNewEpisodes3days": "integer",   // 最近 3 天内发布新节目的 Feed 数
  "feedsWithNewEpisodes7days": "integer",   // 最近 7 天
  "feedsWithNewEpisodes10days": "integer",       // 最近 10 天内发布新节目的 Feed 数量
  "feedsWithNewEpisodes14days": "integer",       // 最近 14 天内发布新节目的 Feed 数量
  "feedsWithNewEpisodes30days": "integer",       // 最近 30 天内发布新节目的 Feed 数量
  "feedsWithNewEpisodes60days": "integer",       // 最近 60 天内发布新节目的 Feed 数量
  "feedsWithNewEpisodes90days": "integer",       // 最近 90 天内发布新节目的 Feed 数量
  "paidFeedsWithNewEpisodes3days": "integer", // 最近 3 天更新且需要付费的 Feed 数
  "paidFeedsWithNewEpisodes7days": "integer",       // 最近 7 天内更新且为付费节目的 Feed 数量
  "paidFeedsWithNewEpisodes10days": "integer",       // 最近 10 天更新且为付费节目的 Feed 数量
  "paidFeedsWithNewEpisodes14days": "integer",       // 最近 14 天更新且为付费节目的 Feed 数量
  "paidFeedsWithNewEpisodes30days": "integer",       // 最近 30 天更新且为付费节目的 Feed 数量
  "paidFeedsWithNewEpisodes60days": "integer",       // 最近 60 天更新且为付费节目的 Feed 数量
  "paidFeedsWithNewEpisodes90days": "integer",       // 最近 90 天更新且为付费节目的 Feed 数量
  "newEpisodes3days": "integer",            // 最近 3 天新增节目的数量
  "newEpisodes7days": "integer",       // 最近 7 天新增的节目数量
  "newEpisodes10days": "integer",       // 最近 10 天新增的节目数量
  "newEpisodes14days": "integer",       // 最近 14 天新增的节目数量
  "newEpisodes30days": "integer",       // 最近 30 天新增的节目数量
  "newEpisodes60days": "integer",       // 最近 60 天新增的节目数量
  "newEpisodes90days": "integer",       // 最近 90 天新增的节目数量
  "feedsWithValueBlocks": "integer",        // 含 Value for Value 配置的 Feed 数
  "feedsWithFundingTag": "integer",         // 含 <podcast:funding> 的 Feed 数
  "feedsWithTranscripts": "integer",        // 提供 transcript 的 Feed 数
  "episodesWithTranscripts": "integer",     // 提供 transcript 的 Episode 数
  "feedsWithChapters": "integer",           // 提供 chapters 的 Feed 数
  "episodesWithChapters": "integer",        // 提供 chapters 的 Episode 数
  "feedsWithMediumMusic": "integer",        // medium=music 的 Feed 数
  "feedsWithMediumVideo": "integer"         // medium=video 的 Feed 数
}
```

## V4V Music Charts
包含接口
```
get /static/stats/v4vmusic.json
- JSON 版排行榜，按近 7 天 Boost 数排序。

get /static/stats/v4vmusic.opml
- OPML 版排行榜，引入 podcastnamespace 扩展属性。

get /static/stats/v4vmusic.rss
- RSS 版排行榜，使用 podcast:remoteItem 指向曲目。
```
以下是 JSON 结构（OPML/RSS 为对应 XML 格式）：
```
{
  "title": "string",                // 榜单标题
  "description": "string",          // 榜单描述
  "timestamp": "integer",           // 更新时间（Unix 秒）
  "items": [                         // 榜单条目
    {
      "rank": "integer",            // 排名
      "boosts": "string",           // 近 7 天收到的 boost 数
      "title": "string",            // 曲目标题
      "image": "string(URL)",       // 曲目封面
      "feedId": "integer",          // 所在 Feed ID
      "feedUrl": "string(URL)",     // Feed URL
      "feedGuid": "string",         // Feed GUID
      "itemGuid": "string"          // 曲目所在节目的 GUID
    }
  ]
}
```

# Stats
## Current Stats
包含接口
```
get /stats/current
- 返回当前索引总体统计数据（实时）。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "stats": {       // 统计数据对象，包含 Feed/Episode 综合指标
    "feedCountTotal": "integer",              // 索引总 Feed 数
    "episodeCountTotal": "integer",           // 索引总 Episode 数
    "feedsWithNewEpisodes3days": "integer",   // 最近 3 天更新的 Feed 数
    "feedsWithNewEpisodes10days": "integer",       // 最近 10 天内发布新节目的 Feed 数量
    "feedsWithNewEpisodes30days": "integer",       // 最近 30 天内发布新节目的 Feed 数量
    "feedsWithNewEpisodes90days": "integer",       // 最近 90 天内发布新节目的 Feed 数量
    "feedsWithValueBlocks": "integer"         // 含 Value for Value 的 Feed 数
  },
  "description": "string"          // 响应描述或状态说明
}
```

# Value
## Value by Feed
包含接口
```
get /value/byfeedid
- 通过 Feed 内部 ID 获取 Value for Value 配置。

get /value/byfeedurl
- 通过 Feed URL 获取 Value for Value 配置。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "query": {                          // 请求参数回显
    "id": "integer?",                // feedId 查询时返回
    "url": "string(URL)?"            // feedUrl 查询时返回
  },
  "value": {                          // Value for Value 配置，可为空
    "model": {                      // Value-for-Value 模型定义
      "type": "string",              // 价值网络类型（如 lightning）
      "method": "string",            // 机制（如 keysend）
      "suggested": "string"          // 建议金额
    },
    "destinations": [             // Value-for-Value 分账配置列表
      {
        "name": "string",            // 分账角色（podcaster、artist 等）
        "address": "string",         // 支付地址（LN 公钥等）
        "type": "string",            // 目的地类型
        "split": "integer",          // 分账比例（百分比）
        "fee": "boolean",            // 是否承担手续费
        "customKey": "string?",      // 自定义键
        "customValue": "string?"     // 自定义值
      }
    ]
  },
  "description": "string"          // 响应描述或状态说明
}
```

## Value by Podcast GUID
包含接口
```
get /value/bypodcastguid
- 通过 Feed 的 <podcast:guid> 获取 Value for Value 配置。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "query": {       // 请求参数回显对象
    "podcastGuid": "string"          // 请求中的 guid 回显
  },
  "value": {       // Value-for-Value 配置对象
    "model": {                      // Value-for-Value 模型定义
      "type": "string",           // 支持的支付网络类型（如 lightning、webmonetization）
      "method": "string",         // 支付方式（如 keysend、lnurl）
      "suggested": "string"      // 建议金额或提示（字符串）
    },
    "destinations": [             // Value-for-Value 分账配置列表
      {
        "name": "string",            // 分账角色名称（如 podcaster）
        "address": "string",         // 分账目标地址（如 LN 公钥、payment pointer）
        "type": "string",            // 分账目标类型（如 node、paymentPointer）
        "split": "integer",          // 分账比例（百分比整数）
        "fee": "boolean",            // 是否承担手续费
        "customKey": "string?",       // 可选：自定义键
        "customValue": "string?"      // 可选：自定义值
      }
    ]
  },           // 结构与 Value by Feed 相同
  "description": "string"          // 响应描述或状态说明
}
```

## Value by Episode GUID
包含接口
```
get /value/byepisodeguid
- 获取单个节目 (episode) 的 Value for Value 配置。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "query": {       // 请求参数回显对象
    "podcastGuid": "string?",        // Feed GUID（若提供）
    "episodeGuid": "string"          // 节目的 GUID
  },
  "value": {       // Value-for-Value 配置对象
    "model": {                      // Value-for-Value 模型定义
      "type": "string",           // 支持的支付网络类型（如 lightning、webmonetization）
      "method": "string",         // 支付方式（如 keysend、lnurl）
      "suggested": "string"      // 建议金额或提示（字符串）
    },                   // 同前述 value->model
    "destinations": [             // Value-for-Value 分账配置列表
      {
        "name": "string",            // 分账角色名称（如 podcaster）
        "address": "string",         // 分账目标地址（如 LN 公钥、payment pointer）
        "type": "string",            // 分账目标类型（如 node、paymentPointer）
        "split": "integer",          // 分账比例（百分比整数）
        "fee": "boolean",            // 是否承担手续费
        "customKey": "string?",       // 可选：自定义键
        "customValue": "string?"      // 可选：自定义值
      }
    ],            // 同前述 value->destinations
    "title": "string",               // 节目标题
    "feedTitle": "string"            // Feed 标题
  },
  "description": "string"          // 响应描述或状态说明
}
```

## Value Batch Lookup
包含接口
```
post /value/batch/byepisodeguid
- 批量查询多个 episode GUID 对应的 Value for Value 配置。
```
以下是schema及释义
```
{
  "status": "boolean",              // 接口调用状态：true=成功，false=失败
  "query": {       // 请求参数回显对象
    "guids": ["string"]              // 请求中提交的 GUID 列表
  },
  "value": [                         // 命中的结果数组
    {
      "podcastGUID": "string",      // Feed GUID
      "guid": "string",             // 节目 GUID
      "title": "string",            // 节目标题
      "feedTitle": "string",        // Feed 标题
      "model": {                      // Value-for-Value 模型定义
        "type": "string",               // 支持的支付网络类型（如 lightning、webmonetization）
        "method": "string",             // 具体支付方式（如 keysend、lnurl）
        "suggested": "string"           // 建议金额或默认提示，字符串形式
      },                // 同前述 value->model
      "destinations": [             // 收款分账列表
        {
          "name": "string",             // 角色名称（如 podcaster、host）
          "address": "string",          // 支付地址（LN 公钥、钱包地址等）
          "type": "string",             // 目的地类型（如 node、paymentPointer）
          "split": "integer",           // 分账比例（百分比整数）
          "fee": "boolean",             // 是否承担手续费
          "customKey": "string?",       // 可选：自定义键
          "customValue": "string?"      // 可选：自定义值
        }
      ]          // 同前述 value->destinations
    }
  ],
  "allFound": "boolean",            // 是否所有 GUID 均匹配成功
  "found": "integer",               // 实际命中的条目数
  "description": "string"          // 响应描述或状态说明
}
```
