import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the datasource connection URL out of schema.prisma and into
// this config file. `engine: "classic"` keeps the traditional query engine
// (URL-based connection) instead of requiring a driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
