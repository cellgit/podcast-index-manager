import { NextResponse } from "next/server";

export async function POST() {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      { error: "SLACK_WEBHOOK_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `Podcast Index Manager 通知测试：${new Date().toISOString()}`,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Slack webhook responded ${response.status}`);
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slack 测试失败" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
