import { test, expect } from "bun:test";
import { config, validateConfig } from "../utils/config.js";

test("config 字段类型与范围检查", () => {
  expect(typeof config.MAX_CONCURRENT).toBe("number");
  expect(Number.isFinite(config.MAX_CONCURRENT)).toBe(true);
  expect(typeof config.MAX_TOKENS).toBe("number");
  expect(Number.isFinite(config.MAX_TOKENS)).toBe(true);
  expect(typeof config.MONTHLY_BUDGET).toBe("number");
  expect(Number.isFinite(config.MONTHLY_BUDGET)).toBe(true);
  const allowed = ['fatal','error','warn','info','debug','trace','silent'];
  expect(allowed.includes(config.LOG_LEVEL)).toBe(true);
  expect(typeof config.MAX_RETRIES).toBe("number");
});

test("validateConfig 在有/无 ANTHROPIC_API_KEY 时的行为 (动态)", () => {
  if (config.ANTHROPIC_API_KEY) {
    // 当环境包含 key 时, validateConfig() 不应抛错
    expect(() => validateConfig()).not.toThrow();
  } else {
    // 否则应抛错
    expect(() => validateConfig()).toThrow();
  }

  // 无论如何, allow mock-mode 应当不抛错
  expect(() => validateConfig({ requireApiKey: false })).not.toThrow();
});
