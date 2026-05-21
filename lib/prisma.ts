/**
 * Prisma 7 singleton — uses the pg driver adapter.
 *
 * Key serverless considerations:
 * - The client is stored on `globalThis` in ALL environments so that
 *   Vercel function instances reuse a single client (and its pool) rather
 *   than opening a fresh pool on every invocation.
 * - Pool size is kept small (max 2) so that concurrent invocations don't
 *   exhaust Supabase's connection limit.
 * - Pair with the Supabase Transaction pooler URL (port 6543) in production
 *   — the Session pooler (port 5432) is not suited for serverless workloads.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg({
    connectionString,
    // Limit pool size per function instance. With the Transaction pooler
    // this prevents exhausting Supabase's connection slots across concurrent
    // Vercel invocations.
    max: 2,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Always reuse the global instance — critical in production where each
// warm function instance must share a single pool rather than opening one
// per request.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

export default prisma;
