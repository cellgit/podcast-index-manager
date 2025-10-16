import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  q: z.string().min(1, "搜索关键词不能为空").optional(),
  podcastId: z.string().regex(/^\d+$/).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export async function GET(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const validation = querySchema.safeParse({
    q: url.searchParams.get("q"),
    podcastId: url.searchParams.get("podcastId"),
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { q, podcastId, page = "1", limit = "50" } = validation.data;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: {
      podcast_id?: number;
      OR?: Array<{ title?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (podcastId) {
      where.podcast_id = parseInt(podcastId);
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ];
    }

    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where,
        orderBy: { date_published: "desc" },
        take: limitNum,
        skip,
        include: {
          podcast: {
            select: {
              id: true,
              title: true,
              author: true,
              image: true,
            },
          },
        },
      }),
      prisma.episode.count({ where }),
    ]);

    return NextResponse.json(
      {
        episodes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Episode search failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
