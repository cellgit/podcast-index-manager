import { PrismaClient } from "@prisma/client";

export const isDatabaseConfigured = Boolean(
  typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.trim().length,
);

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    log: ["error", "warn"],
  });

const prismaClient = isDatabaseConfigured
  ? global.prisma ?? createPrismaClient()
  : undefined;

if (prismaClient && process.env.NODE_ENV !== "production") {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
