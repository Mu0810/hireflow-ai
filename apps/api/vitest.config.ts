import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    fileParallelism: false,
    // Set before any module (and the Prisma client) is imported. The Prisma 7
    // driver adapter reads DATABASE_URL eagerly when db.ts is first imported.
    env: {
      DATABASE_URL:
        "postgresql://hireflow:hireflow@localhost:5432/hireflow_test?schema=public",
      JWT_ACCESS_SECRET: "test-access-secret-32-chars-long!!",
      JWT_REFRESH_SECRET: "test-refresh-secret-32-chars-long!",
    },
  },
});
