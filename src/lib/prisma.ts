import { PrismaClient } from "@prisma/client";

const shouldSkipPrisma =
  process.env.SKIP_PRISMA_CLIENT === "1" ||
  process.env.SKIP_DB_ON_BUILD === "1";

export const isDatabaseConfigured =
  Boolean(
    typeof process.env.DATABASE_URL === "string" &&
      process.env.DATABASE_URL.trim().length,
  ) && !shouldSkipPrisma;

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    log: ["error", "warn"],
  });

const prismaClient =
  isDatabaseConfigured && !shouldSkipPrisma
    ? global.prisma ?? createPrismaClient()
    : undefined;

if (prismaClient && process.env.NODE_ENV !== "production") {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
