import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

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
  const podcastId = Number.parseInt(id, 10);

  await prisma.podcast.delete({
    where: { id: podcastId },
  });

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
