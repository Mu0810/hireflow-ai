import { beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { prisma } from "../config/db";
import { cleanDatabase } from "./helpers";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://hireflow:hireflow@localhost:5432/hireflow_test?schema=public";
  process.env.JWT_ACCESS_SECRET = "test-access-secret-32-chars-long!!";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-32-chars-long!";

  execSync("pnpm prisma migrate deploy --schema=../../prisma/schema.prisma", { stdio: "inherit" });
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
