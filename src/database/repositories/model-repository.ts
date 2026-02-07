import { db } from "../connection.js";
import type { SocialSystemModel } from "../../types.js";

export interface ModelRecord {
  id: number;
  hypothesisId: number;
  hash: string;
  modelJson: string;
  createdAt: string;
}

function toRecord(row: Record<string, unknown>): ModelRecord {
  return {
    id: row.id as number,
    hypothesisId: row.hypothesis_id as number,
    hash: row.hash as string,
    modelJson: row.model_json as string,
    createdAt: row.created_at as string,
  };
}

function serializeModel(model: SocialSystemModel): string {
  return JSON.stringify(model);
}

export class ModelRepository {
  save(hypothesisId: number, hash: string, model: SocialSystemModel): ModelRecord {
    const payload = serializeModel(model);
    const insert = db.query(
      "INSERT INTO models (hypothesis_id, hash, model_json) VALUES ($hypothesisId, $hash, $modelJson)",
    );
    const result = insert.run({ hypothesisId, hash, modelJson: payload });
    const id = Number(result.lastInsertRowid);
    const record = this.findById(id);
    if (!record) {
      throw new Error("Model insert failed");
    }

    return record;
  }

  findById(id: number): ModelRecord | null {
    const query = db.query(
      "SELECT id, hypothesis_id, hash, model_json, created_at FROM models WHERE id = $id",
    );
    const row = query.get({ id }) as Record<string, unknown> | null;
    return row ? toRecord(row) : null;
  }

  findByHypothesisId(hypothesisId: number): ModelRecord[] {
    const query = db.query(
      "SELECT id, hypothesis_id, hash, model_json, created_at FROM models WHERE hypothesis_id = $hypothesisId ORDER BY created_at DESC",
    );
    const rows = query.all({ hypothesisId }) as Record<string, unknown>[];
    return rows.map((row) => toRecord(row));
  }

  findByConfidenceRange(minConfidence: number, maxConfidence: number): ModelRecord[] {
    const query = db.query(
      "SELECT id, hypothesis_id, hash, model_json, created_at FROM models WHERE CAST(json_extract(model_json, '$.metadata.confidence') AS REAL) BETWEEN $minConfidence AND $maxConfidence ORDER BY created_at DESC",
    );
    const rows = query.all({ minConfidence, maxConfidence }) as Record<string, unknown>[];
    return rows.map((row) => toRecord(row));
  }

  delete(id: number): boolean {
    const statement = db.query("DELETE FROM models WHERE id = $id");
    const result = statement.run({ id });
    return result.changes > 0;
  }
}
