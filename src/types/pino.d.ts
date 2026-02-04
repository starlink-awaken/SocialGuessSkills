declare module 'pino' {
  // Minimal subset to satisfy project's usage and TypeScript checks
  export type LevelWithSilent = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent' | string;

  export const stdTimeFunctions: {
    isoTime: () => string;
  };

  const pino: any;
  export default pino;
}
