import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

const bodySchema = z.object({
  podcastId: z.number().int().positive(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = paramsSchema.parse(await params);
  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const collectionId = Number.parseInt(id, 10);
  const position = await prisma.podcastCollectionItem.count({
    where: { collection_id: collectionId },
  });

  await prisma.podcastCollectionItem.upsert({
    where: {
      collection_id_podcast_id: {
        collection_id: collectionId,
        podcast_id: parsed.data.podcastId,
      },
    },
    create: {
      collection_id: collectionId,
      podcast_id: parsed.data.podcastId,
      position,
    },
    update: {
      position,
      added_at: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = paramsSchema.parse(await params);
  const url = new URL(request.url);
  const podcastId = url.searchParams.get("podcastId");
  if (!podcastId) {
    return NextResponse.json(
      { error: "podcastId is required" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const collectionId = Number.parseInt(id, 10);
  const podcastNumeric = Number.parseInt(podcastId, 10);

  const result = await prisma.podcastCollectionItem.deleteMany({
    where: {
      collection_id: collectionId,
      podcast_id: podcastNumeric,
    },
  });

  return NextResponse.json(
    { success: true, removed: result.count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
