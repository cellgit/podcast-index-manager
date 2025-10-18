import { ReactNode } from "react";
import { SyncStatus } from "@prisma/client";

import { Sidebar } from "@/components/sidebar";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  if (!prisma) {
    return <DatabaseConfigurationNotice />;
  }

  let pendingSyncs = 0;
  try {
    pendingSyncs = await prisma.syncLog.count({
      where: { status: SyncStatus.PENDING },
    });
  } catch (error) {
    console.error("无法连接数据库，pendingSyncs 统计失败", error);
    return <DatabaseConfigurationNotice connectionError />;
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar pendingSyncs={pendingSyncs} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function DatabaseConfigurationNotice({ connectionError = false }: { connectionError?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-lg border-dashed border-primary/40">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {connectionError ? "数据库连接异常" : "需要配置数据库"}
          </CardTitle>
          <CardDescription>
            {connectionError
              ? "无法连接到 PostgreSQL，请确认本地数据库服务已启动，或更新连接字符串。"
              : "在控制中心加载目录数据前，请先提供 PostgreSQL 连接字符串。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {connectionError ? (
            <>
              <p>
                无法连接到配置中的 PostgreSQL，请确认本地数据库服务或 docker-compose 容器已经启动并监听
                <code className="rounded bg-muted px-1 py-0.5 text-xs">localhost:5432</code>
                （或其他自定义端口）。
              </p>
              <p>
                如果连接字符串有变更，请更新
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>
                内的
                <code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL</code>
                并重启开发服务器。
              </p>
            </>
          ) : (
            <>
              <p>
                复制
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code>
                至
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>
                ，并将
                <code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL</code>
                更新为可访问的 PostgreSQL 实例。
              </p>
              <p>
                保存后重启开发服务器，Prisma 会连接数据库并为仪表盘填充播客、节目及同步记录。
              </p>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full justify-center" asChild>
            <a
              href="https://www.prisma.io/docs/orm/reference/environment-variables/setting-the-environment-variables"
              target="_blank"
              rel="noreferrer"
            >
              查看 Prisma 配置指南
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
