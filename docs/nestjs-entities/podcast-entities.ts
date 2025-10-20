/**
 * NestJS实体定义 - 播客索引管理器
 * 基于 Prisma Schema 的 TypeORM 实体定义
 * 使用蛇形命名方式与数据库表保持一致
 * 
 * 注意：此文件为实体定义参考文档，实际项目使用 Prisma ORM
 * TypeORM 装饰器仅作为类型定义和文档说明使用
 * 
 * 如需在项目中使用 TypeORM，请先安装依赖：
 * npm install typeorm @nestjs/typeorm pg
 */

// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Index, Unique, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToMany, JoinTable } from 'typeorm';

/**
 * 播客表 - 存储播客源的元数据信息
 */
@Entity('podcasts')
@Index('podcasts_title_idx', ['title'])
@Index('podcasts_language_idx', ['language'])
@Index('podcasts_updated_idx', ['updated_at'])
@Index('podcasts_index_id_idx', ['podcast_index_id'])
@Index('podcasts_itunes_idx', ['itunes_id'])
@Unique('podcasts_podcast_index_id_unique', ['podcast_index_id'])
@Unique('podcasts_podcast_guid_unique', ['podcast_guid'])
@Unique('podcasts_url_unique', ['url'])
export class Podcast {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer', unique: true })
  /** PodcastIndex平台的Feed ID */
  podcast_index_id: number;

  @Column({ type: 'varchar', nullable: true, unique: true })
  /** 播客全局唯一标识符 */
  podcast_guid: string | null;

  @Column({ type: 'varchar' })
  /** 播客标题 */
  title: string;

  @Column({ type: 'varchar', unique: true })
  /** RSS订阅地址 */
  url: string;

  @Column({ type: 'varchar', nullable: true })
  /** 原始订阅地址 */
  original_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 播客网站链接 */
  link: string | null;

  @Column({ type: 'text', nullable: true })
  /** 播客描述 */
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 作者 */
  author: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 所有者名称 */
  owner_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 所有者邮箱 */
  owner_email: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 图片URL */
  image: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 封面图URL */
  artwork: string | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 最后更新时间 */
  last_update_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 最后抓取时间 */
  last_crawl_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 最后解析时间 */
  last_parse_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 最后HTTP状态正常的时间 */
  last_good_http_status_time: Date | null;

  @Column({ type: 'integer', nullable: true })
  /** 最后HTTP状态码 */
  last_http_status: number | null;

  @Column({ type: 'varchar', nullable: true })
  /** 内容类型 */
  content_type: string | null;

  @Column({ type: 'integer', nullable: true })
  /** iTunes ID */
  itunes_id: number | null;

  @Column({ type: 'varchar', nullable: true })
  /** iTunes类型 */
  itunes_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** RSS生成器 */
  generator: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  /** 语言代码 */
  language: string | null;

  @Column({ type: 'boolean', default: false })
  /** 是否包含成人内容 */
  explicit: boolean;

  @Column({ type: 'integer', nullable: true })
  /** 播客类型 */
  type: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  /** 媒体类型(如:podcast, music, video) */
  medium: string | null;

  @Column({ type: 'integer', default: 0 })
  /** 是否已失效(0=正常,1=失效) */
  dead: number;

  @Column({ type: 'integer', nullable: true })
  /** 优先级 */
  priority: number | null;

  @Column({ type: 'boolean', nullable: true })
  /** 是否在轮询队列中 */
  in_polling_queue: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  /** 内容哈希值 */
  chash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  /** PodcastIndex创建时间 */
  created_on: Date | null;

  @Column({ type: 'integer', default: 0 })
  /** 节目总数 */
  episode_count: number;

  @Column({ type: 'integer', default: 0 })
  /** 抓取错误次数 */
  crawl_errors: number;

  @Column({ type: 'integer', default: 0 })
  /** 解析错误次数 */
  parse_errors: number;

  @Column({ type: 'boolean', default: false })
  /** 是否锁定 */
  locked: boolean;

  @Column({ type: 'bigint', nullable: true })
  /** 图片URL哈希值 */
  image_url_hash: bigint | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 最早节目发布日期 */
  oldest_item_pubdate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 最新节目发布日期 */
  newest_item_pubdate: Date | null;

  @Column({ type: 'integer', nullable: true })
  /** 热度值 */
  popularity: number | null;

  @Column({ type: 'integer', nullable: true })
  /** 趋势分数 */
  trend_score: number | null;

  @Column({ type: 'integer', nullable: true })
  /** 重复源的原始Feed ID */
  duplicate_of_feed_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  /** Value for Value创建时间 */
  value_created_on: Date | null;

  @Column({ type: 'text', nullable: true })
  /** Value for Value配置JSON */
  value_block: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 赞助链接 */
  funding_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 赞助信息 */
  funding_message: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 价值模型类型 */
  value_model_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 价值模型方法 */
  value_model_method: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 建议的价值模型 */
  value_model_suggested: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 本地创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 本地更新时间 */
  updated_at: Date;

  @OneToMany(() => Episode, (episode) => episode.podcast)
  /** 关联的节目列表 */
  episodes: Episode[];

  @OneToMany(() => SyncLog, (syncLog) => syncLog.podcast)
  /** 同步日志 */
  sync_logs: SyncLog[];

  @OneToMany(() => PodcastCategory, (podcastCategory) => podcastCategory.podcast)
  /** 播客分类关联 */
  categories: PodcastCategory[];

  @OneToMany(() => PodcastValueDestination, (valueDestination) => valueDestination.podcast)
  /** Value for Value收款地址 */
  value_destinations: PodcastValueDestination[];

  @OneToMany(() => PodcastCollectionItem, (collectionItem) => collectionItem.podcast)
  /** 合集关联 */
  collection_items: PodcastCollectionItem[];

  @OneToOne(() => PodcastEditorial, (editorial) => editorial.podcast)
  /** 编辑信息 */
  editorial: PodcastEditorial;
}

/**
 * 节目表 - 存储播客节目(Episode)的详细信息
 */
@Entity('episodes')
@Index('episodes_podcast_published_idx', ['podcast_id', 'date_published'])
@Index('episodes_published_idx', ['date_published'])
@Index('episodes_title_idx', ['title'])
@Index('episodes_feed_idx', ['feed_id'])
@Unique('episodes_podcast_index_id_unique', ['podcast_index_id'])
@Unique('episodes_podcast_guid_unique', ['podcast_id', 'guid'])
export class Episode {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 所属播客ID */
  podcast_id: number;

  @ManyToOne(() => Podcast, (podcast) => podcast.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  /** 所属播客 */
  podcast: Podcast;

  @Column({ type: 'integer' })
  /** PodcastIndex的Feed ID */
  feed_id: number;

  @Column({ type: 'bigint', nullable: true, unique: true })
  /** PodcastIndex的Episode ID */
  podcast_index_id: bigint | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  /** 节目GUID */
  guid: string | null;

  @Column({ type: 'varchar' })
  /** 节目标题 */
  title: string;

  @Column({ type: 'text', nullable: true })
  /** 节目描述 */
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 节目链接 */
  link: string | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 发布日期 */
  date_published: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 抓取日期 */
  date_crawled: Date | null;

  @Column({ type: 'text', nullable: true })
  /** 音频文件URL */
  enclosure_url: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  /** 音频文件MIME类型 */
  enclosure_type: string | null;

  @Column({ type: 'integer', default: 0 })
  /** 音频文件大小(字节) */
  enclosure_length: number;

  @Column({ type: 'integer', nullable: true })
  /** 时长(秒) */
  duration: number | null;

  @Column({ type: 'boolean', default: false })
  /** 是否包含成人内容 */
  explicit: boolean;

  @Column({ type: 'integer', nullable: true })
  /** 集数 */
  episode: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  /** 节目类型(full, trailer, bonus) */
  episode_type: string | null;

  @Column({ type: 'integer', nullable: true })
  /** 季数 */
  season: number | null;

  @Column({ type: 'varchar', nullable: true })
  /** 节目封面URL */
  image: string | null;

  @Column({ type: 'bigint', nullable: true })
  /** 封面URL哈希值 */
  image_url_hash: bigint | null;

  @Column({ type: 'integer', nullable: true })
  /** 所属播客的iTunes ID */
  feed_itunes_id: number | null;

  @Column({ type: 'varchar', nullable: true })
  /** 播客封面URL */
  feed_image: string | null;

  @Column({ type: 'bigint', nullable: true })
  /** 播客封面URL哈希值 */
  feed_image_url_hash: bigint | null;

  @Column({ type: 'varchar', nullable: true })
  /** 播客RSS地址 */
  feed_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 播客标题 */
  feed_title: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 播客作者 */
  feed_author: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 播客语言 */
  feed_language: string | null;

  @Column({ type: 'integer', nullable: true })
  /** 播客是否失效 */
  feed_dead: number | null;

  @Column({ type: 'integer', nullable: true })
  /** 播客是否重复 */
  feed_duplicate_of: number | null;

  @Column({ type: 'varchar', nullable: true })
  /** 字幕文件URL */
  transcript_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 章节信息URL */
  chapters_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 内容链接 */
  content_link: string | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 直播开始时间 */
  start_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  /** 直播结束时间 */
  end_time: Date | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  /** 状态(live, ended, pending) */
  status: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 价值模型类型 */
  value_model_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 价值模型方法 */
  value_model_method: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 建议的价值模型 */
  value_model_suggested: string | null;

  @Column({ type: 'timestamp', nullable: true })
  /** Value for Value创建时间 */
  value_created_on: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 本地创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 本地更新时间 */
  updated_at: Date;

  @OneToMany(() => EpisodeTranscript, (transcript) => transcript.episode)
  /** 字幕列表 */
  transcripts: EpisodeTranscript[];

  @OneToMany(() => EpisodePerson, (person) => person.episode)
  /** 相关人物 */
  persons: EpisodePerson[];

  @OneToMany(() => EpisodeSoundbite, (soundbite) => soundbite.episode)
  /** 精彩片段 */
  soundbites: EpisodeSoundbite[];

  @OneToMany(() => EpisodeSocialInteraction, (interaction) => interaction.episode)
  /** 社交互动 */
  social_interactions: EpisodeSocialInteraction[];

  @OneToMany(() => EpisodeValueDestination, (valueDestination) => valueDestination.episode)
  /** Value for Value收款地址 */
  value_destinations: EpisodeValueDestination[];
}

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  /** 等待中 */
  PENDING = 'PENDING',
  /** 运行中 */
  RUNNING = 'RUNNING',
  /** 成功 */
  SUCCESS = 'SUCCESS',
  /** 失败 */
  FAILED = 'FAILED',
}

/**
 * 同步日志表 - 记录数据同步任务的执行情况
 */
@Entity('sync_logs')
@Index('sync_logs_status_started_idx', ['status', 'started_at'])
@Index('sync_logs_podcast_started_idx', ['podcast_id', 'started_at'])
@Index('sync_logs_queue_job_idx', ['queue_job_id'])
export class SyncLog {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer', nullable: true })
  /** 关联的播客ID */
  podcast_id: number | null;

  @ManyToOne(() => Podcast, (podcast) => podcast.sync_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  /** 关联的播客 */
  podcast: Podcast | null;

  @Column({ type: 'varchar', length: 64 })
  /** 任务类型 */
  job_type: string;

  @Column({ type: 'enum', enum: SyncStatus })
  /** 任务状态 */
  status: SyncStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  /** 队列任务ID */
  queue_job_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 开始时间 */
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  /** 结束时间 */
  finished_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  /** 任务参数 */
  payload: any;

  @Column({ type: 'jsonb', nullable: true })
  /** 错误信息 */
  error: any;

  @Column({ type: 'text', nullable: true })
  /** 消息 */
  message: string | null;
}

/**
 * 同步游标表 - 记录增量同步的位置
 */
@Entity('sync_cursors')
export class SyncCursor {
  @Column({ type: 'varchar', primary: true })
  /** 游标标识符 */
  id: string;

  @Column({ type: 'varchar' })
  /** 游标值 */
  cursor: string;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 同步工作进程表 - 记录同步工作进程的状态
 */
@Entity('sync_workers')
@Index('sync_workers_name_idx', ['name'])
export class SyncWorker {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'varchar', length: 64 })
  /** 工作进程名称 */
  name: string;

  @Column({ type: 'varchar', length: 32 })
  /** 工作进程状态 */
  status: string;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 最后心跳时间 */
  last_seen: Date;

  @Column({ type: 'jsonb', nullable: true })
  /** 详细信息 */
  details: any;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;
}

/**
 * 分类表 - 存储播客分类信息
 */
@Entity('categories')
export class Category {
  @Column({ type: 'integer', primary: true })
  /** 分类ID */
  id: number;

  @Column({ type: 'varchar' })
  /** 分类名称 */
  name: string;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;

  @OneToMany(() => PodcastCategory, (podcastCategory) => podcastCategory.category)
  /** 播客分类关联 */
  podcast_categories: PodcastCategory[];
}

/**
 * 播客分类关联表 - 多对多关系
 */
@Entity('podcast_categories')
@Index('podcast_categories_category_idx', ['category_id'])
export class PodcastCategory {
  @Column({ type: 'integer', primary: true })
  /** 播客ID */
  podcast_id: number;

  @Column({ type: 'integer', primary: true })
  /** 分类ID */
  category_id: number;

  @ManyToOne(() => Podcast, (podcast) => podcast.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  /** 播客 */
  podcast: Podcast;

  @ManyToOne(() => Category, (category) => category.podcast_categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  /** 分类 */
  category: Category;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;
}

/**
 * 播客合集表 - 用于组织播客集合
 */
@Entity('podcast_collections')
@Unique('podcast_collections_name_unique', ['name'])
export class PodcastCollection {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  /** 合集名称 */
  name: string;

  @Column({ type: 'text', nullable: true })
  /** 合集描述 */
  description: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;

  @OneToMany(() => PodcastCollectionItem, (item) => item.collection)
  /** 合集项目 */
  items: PodcastCollectionItem[];
}

/**
 * 播客合集项目表 - 合集与播客的多对多关系
 */
@Entity('podcast_collection_items')
@Index('collection_items_podcast_idx', ['podcast_id'])
export class PodcastCollectionItem {
  @Column({ type: 'integer', primary: true })
  /** 合集ID */
  collection_id: number;

  @Column({ type: 'integer', primary: true })
  /** 播客ID */
  podcast_id: number;

  @Column({ type: 'integer', default: 0 })
  /** 排序位置 */
  position: number;

  @CreateDateColumn({ type: 'timestamp' })
  /** 添加时间 */
  added_at: Date;

  @ManyToOne(() => PodcastCollection, (collection) => collection.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collection_id' })
  /** 合集 */
  collection: PodcastCollection;

  @ManyToOne(() => Podcast, (podcast) => podcast.collection_items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  /** 播客 */
  podcast: Podcast;
}

/**
 * 质量告警表 - 记录数据质量问题
 */
@Entity('quality_alerts')
@Index('quality_alerts_status_idx', ['status'])
export class QualityAlert {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'varchar', length: 16 })
  /** 严重程度(low, medium, high, critical) */
  severity: string;

  @Column({ type: 'varchar' })
  /** 告警标题 */
  title: string;

  @Column({ type: 'text', nullable: true })
  /** 告警描述 */
  description: string | null;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  /** 状态(open, resolved) */
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  /** 元数据 */
  metadata: any;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  /** 解决时间 */
  resolved_at: Date | null;
}

/**
 * 播客Value for Value收款地址表
 */
@Entity('podcast_value_destinations')
@Index('podcast_value_destinations_podcast_idx', ['podcast_id'])
export class PodcastValueDestination {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 播客ID */
  podcast_id: number;

  @ManyToOne(() => Podcast, (podcast) => podcast.value_destinations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  /** 播客 */
  podcast: Podcast;

  @Column({ type: 'varchar', nullable: true })
  /** 收款人名称 */
  name: string | null;

  @Column({ type: 'varchar' })
  /** 收款地址 */
  address: string;

  @Column({ type: 'varchar', nullable: true })
  /** 地址类型(node, address) */
  type: string | null;

  @Column({ type: 'integer', nullable: true })
  /** 分成比例 */
  split: number | null;

  @Column({ type: 'boolean', nullable: true })
  /** 是否收取费用 */
  fee: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  /** 自定义键 */
  custom_key: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 自定义值 */
  custom_value: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 播客编辑状态枚举
 */
export enum PodcastEditorialStatus {
  /** 激活 */
  ACTIVE = 'ACTIVE',
  /** 暂停 */
  PAUSED = 'PAUSED',
  /** 归档 */
  ARCHIVED = 'ARCHIVED',
}

/**
 * 播客编辑优先级枚举
 */
export enum PodcastEditorialPriority {
  /** 低 */
  LOW = 'LOW',
  /** 普通 */
  NORMAL = 'NORMAL',
  /** 高 */
  HIGH = 'HIGH',
}

/**
 * 播客编辑信息表 - 存储编辑后的播客展示信息
 */
@Entity('podcast_editorials')
export class PodcastEditorial {
  @Column({ type: 'integer', primary: true })
  /** 播客ID(主键) */
  podcast_id: number;

  @OneToOne(() => Podcast, (podcast) => podcast.editorial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  /** 播客 */
  podcast: Podcast;

  @Column({ type: 'enum', enum: PodcastEditorialStatus, default: PodcastEditorialStatus.ACTIVE })
  /** 状态 */
  status: PodcastEditorialStatus;

  @Column({ type: 'enum', enum: PodcastEditorialPriority, default: PodcastEditorialPriority.NORMAL })
  /** 优先级 */
  priority: PodcastEditorialPriority;

  @Column({ type: 'varchar', nullable: true })
  /** 展示标题 */
  display_title: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 展示作者 */
  display_author: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 展示封面 */
  display_image: string | null;

  @Column({ type: 'text', array: true, default: [] })
  /** 标签 */
  tags: string[];

  @Column({ type: 'text', nullable: true })
  /** 备注 */
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 节目字幕表
 */
@Entity('episode_transcripts')
@Index('episode_transcripts_episode_idx', ['episode_id'])
@Unique('episode_transcripts_episode_url_unique', ['episode_id', 'url'])
export class EpisodeTranscript {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 节目ID */
  episode_id: number;

  @ManyToOne(() => Episode, (episode) => episode.transcripts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  /** 节目 */
  episode: Episode;

  @Column({ type: 'varchar' })
  /** 字幕文件URL */
  url: string;

  @Column({ type: 'varchar', nullable: true })
  /** 字幕类型(srt, vtt, json) */
  type: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 字幕语言 */
  language: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 关系类型(captions) */
  rel: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 节目人物表 - 记录节目中提到的人物
 */
@Entity('episode_persons')
@Index('episode_persons_episode_idx', ['episode_id'])
export class EpisodePerson {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 节目ID */
  episode_id: number;

  @ManyToOne(() => Episode, (episode) => episode.persons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  /** 节目 */
  episode: Episode;

  @Column({ type: 'integer', nullable: true })
  /** 人物索引ID */
  person_index_id: number | null;

  @Column({ type: 'varchar' })
  /** 人物姓名 */
  name: string;

  @Column({ type: 'varchar', nullable: true })
  /** 角色(host, guest) */
  role: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'group' })
  /** 所属组织 */
  group_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 人物链接 */
  href: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 人物头像 */
  img: string | null;

  @Column({ type: 'jsonb', nullable: true })
  /** 元数据 */
  metadata: any;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 节目精彩片段表
 */
@Entity('episode_soundbites')
@Index('episode_soundbites_episode_idx', ['episode_id'])
export class EpisodeSoundbite {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 节目ID */
  episode_id: number;

  @ManyToOne(() => Episode, (episode) => episode.soundbites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  /** 节目 */
  episode: Episode;

  @Column({ type: 'integer' })
  /** 开始时间(秒) */
  start_time: number;

  @Column({ type: 'integer' })
  /** 持续时长(秒) */
  duration: number;

  @Column({ type: 'varchar' })
  /** 片段标题 */
  title: string;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 节目社交互动表
 */
@Entity('episode_social_interactions')
@Index('episode_social_interactions_episode_idx', ['episode_id'])
export class EpisodeSocialInteraction {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 节目ID */
  episode_id: number;

  @ManyToOne(() => Episode, (episode) => episode.social_interactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  /** 节目 */
  episode: Episode;

  @Column({ type: 'varchar' })
  /** 互动URL */
  url: string;

  @Column({ type: 'varchar' })
  /** 协议(activitypub, twitter) */
  protocol: string;

  @Column({ type: 'varchar', nullable: true })
  /** 账号ID */
  account_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 账号URL */
  account_url: string | null;

  @Column({ type: 'integer', nullable: true })
  /** 优先级 */
  priority: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 节目Value for Value收款地址表
 */
@Entity('episode_value_destinations')
@Index('episode_value_destinations_episode_idx', ['episode_id'])
export class EpisodeValueDestination {
  @PrimaryGeneratedColumn()
  /** 主键ID */
  id: number;

  @Column({ type: 'integer' })
  /** 节目ID */
  episode_id: number;

  @ManyToOne(() => Episode, (episode) => episode.value_destinations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  /** 节目 */
  episode: Episode;

  @Column({ type: 'varchar', nullable: true })
  /** 收款人名称 */
  name: string | null;

  @Column({ type: 'varchar' })
  /** 收款地址 */
  address: string;

  @Column({ type: 'varchar', nullable: true })
  /** 地址类型(node, address) */
  type: string | null;

  @Column({ type: 'integer', nullable: true })
  /** 分成比例 */
  split: number | null;

  @Column({ type: 'boolean', nullable: true })
  /** 是否收取费用 */
  fee: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  /** 自定义键 */
  custom_key: string | null;

  @Column({ type: 'varchar', nullable: true })
  /** 自定义值 */
  custom_value: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  /** 创建时间 */
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  /** 更新时间 */
  updated_at: Date;
}
