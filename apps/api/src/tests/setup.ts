import { beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import { prisma } from "../config/db";
import { cleanDatabase } from "./helpers";

beforeAll(async () => {
  // DATABASE_URL and JWT secrets are provided via vitest `test.env` so they are
  // set before the Prisma client is constructed at import time.
  // Migrations run from the repo root so Prisma 7 can locate prisma.config.ts.
  const repoRoot = path.resolve(process.cwd(), "../..");
  execSync("pnpm prisma migrate deploy", { cwd: repoRoot, stdio: "inherit" });
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
