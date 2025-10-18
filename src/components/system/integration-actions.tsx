"use client";

import { useState } from "react";
import { Loader2, Server, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type IntegrationActionsProps = {
  redisConfigured: boolean;
  redisReachable: boolean;
  slackConfigured: boolean;
};

export function IntegrationActions({ redisConfigured, redisReachable, slackConfigured }: IntegrationActionsProps) {
  const [queueState, setQueueState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [slackState, setSlackState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [slackMessage, setSlackMessage] = useState<string | null>(null);

  const testQueue = async () => {
    setQueueState("loading");
    setQueueMessage(null);
    try {
      const response = await fetch("/api/system/integrations/queue", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `测试失败（${response.status}）`,
        );
      }
      setQueueState("success");
      setQueueMessage(`已提交测试任务，Job ID: ${payload.jobId ?? "unknown"}`);
    } catch (error) {
      setQueueState("error");
      setQueueMessage(error instanceof Error ? error.message : "测试失败");
    }
  };

  const testSlack = async () => {
    setSlackState("loading");
    setSlackMessage(null);
    try {
      const response = await fetch("/api/system/integrations/slack", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `测试失败（${response.status}）`,
        );
      }
      setSlackState("success");
      setSlackMessage("已向 Slack 发送测试通知，请检查频道");
    } catch (error) {
      setSlackState("error");
      setSlackMessage(error instanceof Error ? error.message : "测试失败");
    }
  };

  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Server className="h-4 w-4" />
            <span>Redis 队列</span>
          </div>
          <Badge variant={redisConfigured ? (redisReachable ? "success" : "warning") : "destructive"}>
            {redisConfigured ? (redisReachable ? "已连接" : "无法连接") : "未配置"}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={testQueue}
          disabled={!redisConfigured || queueState === "loading"}
        >
          {queueState === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          发送测试任务
        </Button>
        {queueMessage ? (
          <p className={queueState === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {queueMessage}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <BellRing className="h-4 w-4" />
            <span>Slack 通知</span>
          </div>
          <Badge variant={slackConfigured ? "success" : "destructive"}>
            {slackConfigured ? "已配置" : "未配置"}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={testSlack}
          disabled={!slackConfigured || slackState === "loading"}
        >
          {slackState === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          发送测试通知
        </Button>
        {slackMessage ? (
          <p className={slackState === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {slackMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
