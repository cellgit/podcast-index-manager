import { NextResponse } from "next/server";

import {
  PodcastIndexRequestError,
  createPodcastIndexClient,
} from "@/lib/podcast-index";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const status = {
    database: {
      healthy: false,
      message: "未配置数据库连接",
    },
    podcastIndex: {
      healthy: false,
      message: "未配置 PodcastIndex 凭据",
    },
  };

  if (!prisma) {
    return NextResponse.json({ status }, { status: 200 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = {
      healthy: true,
      message: "数据库连接正常",
    };
  } catch (error) {
    status.database = {
      healthy: false,
      message: error instanceof Error ? error.message : "数据库连接失败",
    };
  }

  if (process.env.PODCASTINDEX_API_KEY && process.env.PODCASTINDEX_API_SECRET) {
    try {
      const client = createPodcastIndexClient();
      await client.searchPodcasts("podcast", 1);
      status.podcastIndex = {
        healthy: true,
        message: "凭据有效，可以访问 PodcastIndex",
      };
    } catch (error) {
      status.podcastIndex = {
        healthy: false,
        message:
          error instanceof PodcastIndexRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : "PodcastIndex 请求失败",
      };
    }
  }

  return NextResponse.json({ status }, { status: 200 });
}
