import { NextResponse } from "next/server";

import { enqueueSyncRecentJob } from "@/jobs/sync-recent";

export async function POST() {
  if (!process.env.REDIS_URL) {
    return NextResponse.json(
      { error: "REDIS_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const job = await enqueueSyncRecentJob({ max: 1, triggeredBy: "integration-test" });
    return NextResponse.json(
      {
        queued: true,
        jobId: job.id,
      },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Queue test failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
