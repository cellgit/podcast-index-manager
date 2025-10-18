import type { PrismaClient } from "@prisma/client";

import { logger } from "@/lib/logger";
import { notifyAlert, type AlertMessage } from "@/lib/notifications";

export class QualityService {
  constructor(private readonly db: PrismaClient) {}

  async evaluateAndPersist() {
    const alerts: AlertMessage[] = [];

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedSyncs = await this.db.syncLog.count({
      where: { status: "FAILED", started_at: { gte: since24h } },
    });
    if (failedSyncs > 0) {
      alerts.push({
        title: "最近同步失败告警",
        severity: failedSyncs > 5 ? "critical" : "warning",
        description: `过去 24 小时共有 ${failedSyncs} 个同步任务失败，请确认 PodcastIndex 凭据与网络。`,
        metadata: { failedSyncs },
      });
    }

    const valueFeeds = await this.db.podcast.count({
      where: {
        OR: [
          {
            value_model_type: { not: null },
            value_destinations: { none: {} },
          },
          {
            value_block: { not: null },
            value_destinations: { none: {} },
          },
        ],
      },
    });
    if (valueFeeds > 0) {
      alerts.push({
        title: "Value-for-Value 配置不完整",
        severity: "warning",
        description: `${valueFeeds} 个播客启用了 Value 标签但未配置 destinations，请在内容库中补全。`,
        metadata: { valueFeeds },
      });
    }

    const missingChapters = await this.db.episode.count({
      where: {
        date_published: { gte: since24h },
        chapters_url: null,
        podcast: { medium: "music" },
      },
    });
    if (missingChapters > 0) {
      alerts.push({
        title: "音乐播客缺少章节信息",
        severity: "info",
        description: `最近 24 小时抓取的音乐播客节目有 ${missingChapters} 条缺少章节数据，可检查源站是否发布 chapters.json。`,
        metadata: { missingChapters },
      });
    }

    const missingTranscripts = await this.db.episode.count({
      where: {
        date_published: { gte: since24h },
        transcript_url: null,
        podcast: { medium: { in: ["podcast", "music"] } },
      },
    });
    if (missingTranscripts > 0) {
      alerts.push({
        title: "节目缺少转录文本",
        severity: "info",
        description: `最近 24 小时抓取的节目有 ${missingTranscripts} 条缺少转录，可检查内容库或上游转录服务。`,
        metadata: { missingTranscripts },
      });
    }

    await Promise.all(alerts.map((alert) => this.upsertAlert(alert)));

    // Resolve old alerts if no longer triggered
    await this.resolveStaleAlerts(alerts.map((alert) => alert.title));

    if (alerts.length > 0) {
      logger.info(
        {
          alerts: alerts.map((alert) => ({
            title: alert.title,
            severity: alert.severity,
            metadata: alert.metadata,
          })),
        },
        "quality alerts generated",
      );
    } else {
      logger.debug("quality checks passed without alerts");
    }

    await Promise.all(
      alerts.map(async (alert) => {
        try {
          await notifyAlert(alert);
        } catch (error) {
          logger.error(
            { err: error, alert },
            "failed to dispatch quality alert notification",
          );
        }
      }),
    );

    return alerts;
  }

  async listOpenAlerts(limit = 20) {
    return this.db.qualityAlert.findMany({
      where: { status: "open" },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  async resolveAlert(id: number) {
    return this.db.qualityAlert.update({
      where: { id },
      data: { status: "resolved", resolved_at: new Date() },
    });
  }

  private async upsertAlert(alert: AlertMessage) {
    const existing = await this.db.qualityAlert.findFirst({
      where: { title: alert.title, status: "open" },
    });
    if (existing) {
      await this.db.qualityAlert.update({
        where: { id: existing.id },
        data: {
          severity: alert.severity,
          description: alert.description,
          metadata: alert.metadata,
        },
      });
      return existing.id;
    }
    const created = await this.db.qualityAlert.create({
      data: {
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metadata: alert.metadata,
      },
    });
    return created.id;
  }

  private async resolveStaleAlerts(activeTitles: string[]) {
    await this.db.qualityAlert.updateMany({
      where: {
        status: "open",
        NOT: {
          title: { in: activeTitles.length ? activeTitles : ["__none__"] },
        },
      },
      data: { status: "resolved", resolved_at: new Date() },
    });
  }
}
