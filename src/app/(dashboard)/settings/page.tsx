import { prisma } from "@/lib/prisma";

import { SystemHealthCard } from "@/components/system/system-health-card";
import { IntegrationActions } from "@/components/system/integration-actions";
import { CopyCommandButton } from "@/components/system/copy-command-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pingRedisConnection } from "@/jobs/config";

const JOB_COMMAND = "npm run job:sync-recent";
const CRON_EXAMPLE = `# 每 10 分钟同步一次 PodcastIndex 增量更新
*/10 * * * * cd /path/to/podcast-index-manager && ${JOB_COMMAND}`;

export default async function SettingsPage() {
  if (!prisma) {
    return null;
  }

  const redisConfigured = Boolean(process.env.REDIS_URL);
  let redisReachable = false;
  if (redisConfigured) {
    try {
      await pingRedisConnection();
      redisReachable = true;
    } catch (error) {
      console.error("Redis ping failed", error);
      redisReachable = false;
    }
  }

  const slackConfigured = Boolean(process.env.SLACK_WEBHOOK_URL);

  const envStatus = {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    apiKey: Boolean(process.env.PODCASTINDEX_API_KEY),
    apiSecret: Boolean(process.env.PODCASTINDEX_API_SECRET),
    userAgent: Boolean(process.env.PODCASTINDEX_USER_AGENT),
    redisUrl: redisConfigured,
    slackWebhook: slackConfigured,
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">系统管理</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">系统设置</h1>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SystemHealthCard />

          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">凭据与连接</CardTitle>
              <CardDescription>
                环境变量配置状态（仅指示是否已设置，敏感值不会显示）。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <EnvRow label="DATABASE_URL" healthy={envStatus.databaseUrl} />
              <EnvRow label="PODCASTINDEX_API_KEY" healthy={envStatus.apiKey} />
              <EnvRow label="PODCASTINDEX_API_SECRET" healthy={envStatus.apiSecret} />
              <EnvRow label="PODCASTINDEX_USER_AGENT" healthy={envStatus.userAgent} />
              <EnvRow label="REDIS_URL" healthy={envStatus.redisUrl} />
              <EnvRow label="SLACK_WEBHOOK_URL" healthy={envStatus.slackWebhook} />
              <p className="text-xs">
                若任一项显示“未配置”，请更新
                <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">.env.local</code>
                后重新启动服务。
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">队列与通知</CardTitle>
              <CardDescription>
                验证 Redis 队列和 Slack Webhook，确保自动化与告警可以正常运行。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationActions
                redisConfigured={redisConfigured}
                redisReachable={redisReachable}
                slackConfigured={slackConfigured}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">自动化任务（Cron）</CardTitle>
              <CardDescription>
                推荐将增量同步脚本加入到定时任务，确保目录持续更新。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <code className="text-xs">{JOB_COMMAND}</code>
                <CopyCommandButton command={JOB_COMMAND} />
              </div>
              <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-xs">
                <p className="font-medium text-foreground">Cron 示例</p>
                <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                  {CRON_EXAMPLE}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                建议在独立的 Worker 或任务队列中运行，避免与前端请求竞争资源。脚本会复用环境变量并在执行后自动断开数据库连接。
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">运维文档</CardTitle>
              <CardDescription>快速进入常用文档与排障资源。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://api.podcastindex.org/developer-docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  PodcastIndex API 文档
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases"
                  target="_blank"
                  rel="noreferrer"
                >
                  Prisma 数据库配置
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://nextjs.org/docs/app/building-your-application/routing"
                  target="_blank"
                  rel="noreferrer"
                >
                  Next.js 路由指南
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

type EnvRowProps = {
  label: string;
  healthy: boolean;
};

function EnvRow({ label, healthy }: EnvRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <Badge variant={healthy ? "success" : "destructive"} className="text-[10px]">
        {healthy ? "已配置" : "未配置"}
      </Badge>
    </div>
  );
}
