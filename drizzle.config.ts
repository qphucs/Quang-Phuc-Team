import { defineConfig } from "drizzle-kit";

// Node built-in .env loader (no dotenv dependency).
try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional when variables come from the shell.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  casing: "snake_case",
  dbCredentials: { url: process.env.DB_URL ?? "" },
  strict: true,
  verbose: true,
});
