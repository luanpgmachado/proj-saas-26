import { defineConfig } from "drizzle-kit";

const connectionString = process.env.REPLIT_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or REPLIT_DB_URL must be set");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
