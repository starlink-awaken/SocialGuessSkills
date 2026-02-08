import { Database } from "bun:sqlite";
import { readFileSync } from "fs";

const schemaSql = readFileSync(new URL("./schema.sql", import.meta.url), "utf-8");

let database: Database | null = null;

function isTestEnv(): boolean {
  return (
    process.env.BUN_TEST === "1" ||
    process.env.BUN_ENV === "test" ||
    process.env.NODE_ENV === "test" ||
    process.env.TEST === "1" ||
    process.env.CI === "true"
  );
}

export function getDatabase(): Database {
  if (!database) {
    const dbPath = isTestEnv() ? ":memory:" : "data.sqlite";
    database = new Database(dbPath, { create: true });
    database.exec(schemaSql);
  }

  return database;
}

/** Reset the singleton (useful for tests needing a fresh DB). */
export function resetDatabase(): void {
  if (database) {
    database.close();
    database = null;
  }
}

export const db = getDatabase();
