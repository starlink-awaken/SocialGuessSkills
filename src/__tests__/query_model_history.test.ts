import { describe, it, expect, vi } from "bun:test";

vi.mock("../database/repositories/model-repository.js", () => ({
  ModelRepository: vi.fn().mockImplementation(() => ({
    findByHypothesisId: vi.fn(() => [{ modelJson: '{"valid": true}' }, { modelJson: '{"invalid": json}' }]),
    findByConfidenceRange: vi.fn(() => [])
  }))
}));

vi.mock("../database/repositories/hypothesis-repository.js", () => ({
  HypothesisRepository: vi.fn().mockImplementation(() => ({
    findByHash: vi.fn(() => ({ id: 1 }))
  }))
}));

// Note: queryModelHistory export no longer exists in server.ts
// import { queryModelHistory } from "../server";

describe("query_model_history", () => {
  it.skip("logs a warning for invalid JSON and filters null models", async () => {
    // const logger = { warn: vi.fn() };
    // const args = { hypothesisId: 1 };

    // const result = await queryModelHistory(args, { logger });

    // expect(logger.warn).toHaveBeenCalledWith(
    //   expect.objectContaining({ error: expect.any(Error) }),
    //   expect.stringContaining("Failed to parse model history JSON")
    // );
    // expect(result).toEqual([
    //   { valid: true }
    // ]);
  });
});