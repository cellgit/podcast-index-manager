import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PodcastIndexRequestError,
  createPodcastIndexClient,
} from "@/lib/podcast-index";
import {
  isPodcastIndexFallbackEnabled,
  searchPodcastIndexFallback,
} from "@/lib/podcast-index-fallback";

const querySchema = z.object({
  term: z.string().min(2, "搜索关键词需至少两个字符"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const validation = querySchema.safeParse({ term: url.searchParams.get("term") });

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const client = createPodcastIndexClient();

  try {
    const feeds = await client.searchPodcasts(validation.data.term, 25);

    return NextResponse.json(
      { feeds },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("PodcastIndex search failed", error);

    if (error instanceof PodcastIndexRequestError && isPodcastIndexFallbackEnabled()) {
      const { feeds: fallbackFeeds, matchType } = searchPodcastIndexFallback(
        validation.data.term,
        25,
      );
      const fallbackMessage =
        matchType === "keyword"
          ? `PodcastIndex 当前不可用，已返回离线示例数据（${fallbackFeeds.length} 条匹配“${validation.data.term}”）。`
          : `PodcastIndex 当前不可用，已展示离线示例目录便于演示（共 ${fallbackFeeds.length} 条）。`;
      return NextResponse.json(
        {
          feeds: fallbackFeeds,
          meta: {
            source: "fallback",
            message: fallbackMessage,
          },
        },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const responseMessage =
      error instanceof PodcastIndexRequestError
        ? error.message
        : "PodcastIndex 搜索失败，请查看服务器日志。";
    const status = error instanceof PodcastIndexRequestError ? 502 : 500;

    return NextResponse.json(
      { error: responseMessage },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
