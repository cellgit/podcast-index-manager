import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PodcastEditorialPriority,
  PodcastEditorialStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

const bodySchema = z
  .object({
    displayTitle: z.string().trim().max(256).optional(),
    displayAuthor: z.string().trim().max(128).optional(),
    displayImage: z.string().trim().url().max(1024).optional(),
    status: z.nativeEnum(PodcastEditorialStatus).optional(),
    priority: z.nativeEnum(PodcastEditorialPriority).optional(),
    tags: z
      .array(z.string().trim().min(1).max(32))
      .max(12)
      .optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (payload) =>
      Object.values(payload).some((value) => value !== undefined),
    {
      message: "至少提供一个字段用于更新",
    },
  );

export async function PATCH(
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

  const podcastId = Number.parseInt(id, 10);
  const data = parsed.data;
  const normalizedTags = data.tags ? Array.from(new Set(data.tags)) : undefined;

  const editor = await prisma.podcastEditorial.upsert({
    where: { podcast_id: podcastId },
    create: {
      podcast_id: podcastId,
      status: data.status ?? PodcastEditorialStatus.ACTIVE,
      priority: data.priority ?? PodcastEditorialPriority.NORMAL,
      display_title:
        data.displayTitle && data.displayTitle.length > 0
          ? data.displayTitle
          : null,
      display_author:
        data.displayAuthor && data.displayAuthor.length > 0
          ? data.displayAuthor
          : null,
      display_image:
        data.displayImage && data.displayImage.length > 0
          ? data.displayImage
          : null,
      tags: normalizedTags ?? [],
      notes:
        data.notes && data.notes.length > 0
          ? data.notes
          : null,
    },
    update: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.displayTitle !== undefined
        ? {
            display_title:
              data.displayTitle && data.displayTitle.length > 0
                ? data.displayTitle
                : null,
          }
        : {}),
      ...(data.displayAuthor !== undefined
        ? {
            display_author:
              data.displayAuthor && data.displayAuthor.length > 0
                ? data.displayAuthor
                : null,
          }
        : {}),
      ...(data.displayImage !== undefined
        ? {
            display_image:
              data.displayImage && data.displayImage.length > 0
                ? data.displayImage
                : null,
          }
        : {}),
      ...(normalizedTags !== undefined ? { tags: normalizedTags } : {}),
      ...(data.notes !== undefined
        ? {
            notes:
              data.notes && data.notes.length > 0
                ? data.notes
                : null,
          }
        : {}),
    },
  });

  return NextResponse.json(
    { editorial: editor },
    { headers: { "Cache-Control": "no-store" } },
  );
}
