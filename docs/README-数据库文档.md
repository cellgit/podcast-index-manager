# 数据库表字段文档更新说明

## 完成内容

本次更新完成了以下工作：

### 1. ✅ Schema.prisma 中文注释

为 `prisma/schema.prisma` 文件中的所有表和字段添加了详细的中文注释，包括：

- **17 张数据表**的完整注释
- **所有字段**的中文说明
- **3 个枚举类型**的说明
- **表关系**的注释

文件位置：`prisma/schema.prisma`

### 2. ✅ NestJS 实体定义

在 `docs/nestjs-entities/podcast-entities.ts` 中创建了完整的 NestJS + TypeORM 实体定义，包括：

- **17 个实体类**，与数据库表一一对应
- **使用蛇形命名**（snake_case），与数据库字段名保持一致
- **完整的装饰器**：@Entity, @Column, @Index, @Unique 等
- **关系映射**：@ManyToOne, @OneToMany, @OneToOne
- **详细的中文注释**，每个字段都有说明

文件位置：`docs/nestjs-entities/podcast-entities.ts`

### 3. ✅ 数据库文档

创建了完整的数据库表字段说明文档：

- 数据库连接信息
- 17 张表的结构概览
- 每张表的详细字段说明
- 索引和唯一约束说明
- 枚举类型定义
- 表关系图
- Markdown 格式，易于阅读和维护

文件位置：`docs/数据库表字段说明.md`

## 数据库表列表

### 核心表
1. **podcasts** - 播客表（51个字段）
2. **episodes** - 节目表（43个字段）

### 同步管理表
3. **sync_logs** - 同步日志表（10个字段）
4. **sync_cursors** - 同步游标表（3个字段）
5. **sync_workers** - 同步工作进程表（6个字段）

### 分类和合集表
6. **categories** - 分类表（4个字段）
7. **podcast_categories** - 播客分类关联表（3个字段）
8. **podcast_collections** - 播客合集表（5个字段）
9. **podcast_collection_items** - 播客合集项目表（4个字段）

### 编辑和质量表
10. **podcast_editorials** - 播客编辑信息表（10个字段）
11. **quality_alerts** - 质量告警表（9个字段）

### Value for Value 相关表
12. **podcast_value_destinations** - 播客 Value 收款地址表（11个字段）
13. **episode_value_destinations** - 节目 Value 收款地址表（11个字段）

### 节目扩展表
14. **episode_transcripts** - 节目字幕表（8个字段）
15. **episode_persons** - 节目人物表（11个字段）
16. **episode_soundbites** - 节目精彩片段表（7个字段）
17. **episode_social_interactions** - 节目社交互动表（9个字段）

## 文件结构

```
podcast-index-manager/
├── prisma/
│   └── schema.prisma                    # ✨ 已添加中文注释
├── docs/
│   ├── nestjs-entities/
│   │   └── podcast-entities.ts          # ✨ 新建 NestJS 实体定义
│   ├── 数据库表字段说明.md                # ✨ 新建 数据库文档
│   └── README-数据库文档.md              # 📝 本文件
└── ...
```

## 使用说明

### 1. Prisma Schema

`prisma/schema.prisma` 是项目实际使用的数据库 schema 定义文件，已添加完整的中文注释。

```bash
# 生成 Prisma Client
npm run prisma:generate

# 查看数据库
npm run prisma:studio

# 创建迁移
npm run prisma:migrate
```

### 2. NestJS 实体定义

`docs/nestjs-entities/podcast-entities.ts` 是基于 TypeORM 的实体定义参考文档。

**注意**：
- 此文件仅作为**参考文档**使用
- 项目实际使用的是 **Prisma ORM**
- 如需使用 TypeORM，需要先安装依赖：
  ```bash
  npm install typeorm @nestjs/typeorm pg
  ```

### 3. 数据库文档

`docs/数据库表字段说明.md` 包含了所有表的详细说明，可用于：
- 团队成员查阅数据库结构
- 新成员快速了解数据模型
- API 开发时的字段参考
- 数据库设计评审

## 命名规范

本项目严格遵循以下命名规范：

### 数据库层（Prisma Schema）
- **表名**：蛇形命名（snake_case），如 `podcast_categories`
- **字段名**：蛇形命名（snake_case），如 `podcast_index_id`
- **模型名**：帕斯卡命名（PascalCase），如 `PodcastCategory`

### 代码层（TypeScript/NestJS）
- **类名**：帕斯卡命名（PascalCase），如 `PodcastCategory`
- **属性名**：蛇形命名（snake_case），与数据库字段保持一致
- **方法名**：驼峰命名（camelCase），如 `getPodcastById`

## 数据库信息

- **类型**: PostgreSQL 16
- **连接字符串**: `postgresql://admin:admin123@localhost:5432/podcast-index-manger`
- **ORM**: Prisma
- **容器**: Docker (pg-podcast-index-manager)

## 枚举类型

### SyncStatus - 同步状态
```typescript
enum SyncStatus {
  PENDING = 'PENDING',   // 等待中
  RUNNING = 'RUNNING',   // 运行中
  SUCCESS = 'SUCCESS',   // 成功
  FAILED = 'FAILED',     // 失败
}
```

### PodcastEditorialStatus - 播客编辑状态
```typescript
enum PodcastEditorialStatus {
  ACTIVE = 'ACTIVE',     // 激活
  PAUSED = 'PAUSED',     // 暂停
  ARCHIVED = 'ARCHIVED', // 归档
}
```

### PodcastEditorialPriority - 播客编辑优先级
```typescript
enum PodcastEditorialPriority {
  LOW = 'LOW',           // 低
  NORMAL = 'NORMAL',     // 普通
  HIGH = 'HIGH',         // 高
}
```

## 表关系概览

```
podcasts (播客表)
├── episodes (1:N) - 节目
│   ├── episode_transcripts (1:N) - 字幕
│   ├── episode_persons (1:N) - 人物
│   ├── episode_soundbites (1:N) - 精彩片段
│   ├── episode_social_interactions (1:N) - 社交互动
│   └── episode_value_destinations (1:N) - Value收款地址
├── sync_logs (1:N) - 同步日志
├── podcast_categories (N:M) - 分类关联
│   └── categories
├── podcast_value_destinations (1:N) - Value收款地址
├── podcast_collection_items (N:M) - 合集关联
│   └── podcast_collections
└── podcast_editorial (1:1) - 编辑信息
```

## 统计信息

- **总表数**: 17 张
- **总字段数**: 约 250+ 个字段
- **索引数**: 20+ 个
- **唯一约束**: 10+ 个
- **外键关系**: 15+ 个
- **枚举类型**: 3 个

## 更新历史

- **2025-10-20**: 
  - ✅ 为 schema.prisma 添加完整中文注释
  - ✅ 创建 NestJS/TypeORM 实体定义文档
  - ✅ 创建数据库表字段说明文档
  - ✅ 创建本 README 文档

## 后续工作建议

1. **API 文档生成**：基于实体定义生成 Swagger/OpenAPI 文档
2. **ER 图生成**：使用工具生成可视化的数据库关系图
3. **数据字典导出**：生成 Excel 格式的数据字典
4. **迁移文档**：记录每次数据库迁移的详细说明

## 相关链接

- [Prisma 官方文档](https://www.prisma.io/docs)
- [NestJS 官方文档](https://docs.nestjs.com)
- [TypeORM 官方文档](https://typeorm.io)
- [PodcastIndex API 文档](https://podcastindex-org.github.io/docs-api/)

---

**文档维护者**: GitHub Copilot  
**最后更新**: 2025-10-20
