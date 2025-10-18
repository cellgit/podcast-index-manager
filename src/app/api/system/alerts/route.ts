import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { QualityService } from "@/services/quality-service";

export async function GET() {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const service = new QualityService(prisma);
  const alerts = await service.listOpenAlerts();
  return NextResponse.json({ alerts }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const service = new QualityService(prisma);
  const alerts = await service.evaluateAndPersist();
  return NextResponse.json({ alerts }, { headers: { "Cache-Control": "no-store" } });
}
