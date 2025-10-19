import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

const bodySchema = z
  .object({
    name: z.string().trim().min(2).max(128).optional(),
    description: z
      .string()
      .transform((value) => value.trim())
      .max(1024)
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "至少提供 name 或 description 之一",
  });

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

  const collectionId = Number.parseInt(id, 10);
  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name.trim();
  }
  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description.length ? parsed.data.description : null;
  }

  const collection = await prisma.podcastCollection.update({
    where: { id: collectionId },
    data,
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(
    { collection },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = paramsSchema.parse(await params);
  const collectionId = Number.parseInt(id, 10);

  await prisma.podcastCollection.delete({
    where: { id: collectionId },
  });

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
