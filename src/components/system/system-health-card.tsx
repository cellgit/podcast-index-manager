"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type HealthStatus = {
  database: { healthy: boolean; message?: string };
  podcastIndex: { healthy: boolean; message?: string };
};

export function SystemHealthCard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/system/health", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : `自检失败（${response.status}）`,
        );
      }
      setStatus(result.status as HealthStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "自检失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">系统健康检查</CardTitle>
        <CardDescription>
          立即验证数据库连接与 PodcastIndex 凭据是否正常工作。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleCheck} disabled={loading} className="w-full justify-center">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          {loading ? "正在检测…" : "运行健康检查"}
        </Button>
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
        {status ? (
          <div className="space-y-2">
            <HealthRow
              label="PostgreSQL 数据库"
              healthy={status.database.healthy}
              message={status.database.message}
            />
            <HealthRow
              label="PodcastIndex API"
              healthy={status.podcastIndex.healthy}
              message={status.podcastIndex.message}
            />
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        该检测会发起一次轻量级查询及 PodcastIndex 搜索调用，不会修改任何数据。
      </CardFooter>
    </Card>
  );
}

type HealthRowProps = {
  label: string;
  healthy: boolean;
  message?: string;
};

function HealthRow({ label, healthy, message }: HealthRowProps) {
  return (
    <div
      className={
        healthy
          ? "flex items-start gap-2 rounded-md border border-emerald-200/40 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/20 dark:text-emerald-300"
          : "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      }
    >
      {healthy ? (
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      ) : (
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      )}
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-[11px] opacity-80">
          {message ?? (healthy ? "连接正常" : "自检失败")}
        </p>
      </div>
    </div>
  );
}
