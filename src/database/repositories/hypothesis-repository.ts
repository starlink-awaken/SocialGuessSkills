import { db } from "../connection.js";
import type { Hypothesis } from "../../types.js";

export interface HypothesisRecord {
  id: number;
  hash: string;
  content: string;
  createdAt: string;
}

function normalizeHypothesis(hypothesis: Hypothesis): Hypothesis {
  return {
    assumptions: [...hypothesis.assumptions].map((item) => item.trim()).filter(Boolean),
    constraints: [...hypothesis.constraints].map((item) => item.trim()).filter(Boolean),
    goals: [...hypothesis.goals].map((item) => item.trim()).filter(Boolean),
  };
}

async function computeHypothesisHash(hypothesis: Hypothesis): Promise<string> {
  const normalized = normalizeHypothesis(hypothesis);
  const payload = JSON.stringify(normalized);
  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toRecord(row: Record<string, unknown>): HypothesisRecord {
  return {
    id: row.id as number,
    hash: row.hash as string,
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

export class HypothesisRepository {
  async save(hypothesis: Hypothesis): Promise<HypothesisRecord> {
    const hash = await computeHypothesisHash(hypothesis);
    const existing = this.findByHash(hash);
    if (existing) {
      return existing;
    }

    const payload = JSON.stringify(normalizeHypothesis(hypothesis));
    const insert = db.query("INSERT INTO hypotheses (hash, content) VALUES ($hash, $content)");
    const result = insert.run({ $hash: hash, $content: payload });
    const id = Number(result.lastInsertRowid);
    const record = this.findById(id);
    if (!record) {
      throw new Error("Hypothesis insert failed");
    }

    return record;
  }

  findById(id: number): HypothesisRecord | null {
    const query = db.query("SELECT id, hash, content, created_at FROM hypotheses WHERE id = $id");
    const row = query.get({ $id: id }) as Record<string, unknown> | null;
    return row ? toRecord(row) : null;
  }

  findByHash(hash: string): HypothesisRecord | null {
    const query = db.query("SELECT id, hash, content, created_at FROM hypotheses WHERE hash = $hash");
    const row = query.get({ $hash: hash }) as Record<string, unknown> | null;
    return row ? toRecord(row) : null;
  }

  delete(id: number): boolean {
    const statement = db.query("DELETE FROM hypotheses WHERE id = $id");
    const result = statement.run({ $id: id });
    return result.changes > 0;
  }
}
