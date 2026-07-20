import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, which normally loads .env for us.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
