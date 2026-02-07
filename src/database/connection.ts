import { Database } from "bun:sqlite";
import { readFileSync } from "fs";

const schemaSql = readFileSync(new URL("./schema.sql", import.meta.url), "utf-8");

let database: Database | null = null;

export function getDatabase(): Database {
  if (!database) {
    database = new Database("data.sqlite", { create: true });
    database.exec(schemaSql);
  }

  return database;
}

export const db = getDatabase();
