import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(2, "名称至少 2 个字符"),
  description: z.string().max(1024).optional(),
});

export async function GET() {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const collections = await prisma.podcastCollection.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ collections }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const collection = await prisma.podcastCollection.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim(),
    },
  });

  return NextResponse.json({ collection }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
