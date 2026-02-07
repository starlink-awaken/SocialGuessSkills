type MockAgentResult = {
  conclusion: string;
  evidence: string[];
  risks: string[];
  suggestions: string[];
  falsifiable: string;
};

const RUNS = 100;
const MOCK_DELAY_MS = 8;

const mockAgent = async (index: number): Promise<MockAgentResult> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });

  return {
    conclusion: `mock-conclusion-${index}`,
    evidence: [`evidence-${index}`],
    risks: [`risk-${index}`],
    suggestions: [`suggestion-${index}`],
    falsifiable: `falsifiable-${index}`
  };
};

const runSequential = async () => {
  const start = Date.now();
  for (let i = 0; i < RUNS; i += 1) {
    await mockAgent(i);
  }
  return Date.now() - start;
};

const runParallel = async () => {
  const start = Date.now();
  await Promise.all(Array.from({ length: RUNS }, (_, i) => mockAgent(i)));
  return Date.now() - start;
};

const formatMs = (value: number) => `${value}ms`;

const main = async () => {
  const sequentialTime = await runSequential();
  const parallelTime = await runParallel();
  const speedup = sequentialTime / parallelTime;

  console.log(`顺序执行时间: ${formatMs(sequentialTime)}`);
  console.log(`并行执行时间: ${formatMs(parallelTime)}`);
  console.log(`实际加速比: ${speedup.toFixed(2)}x`);
};

await main();
