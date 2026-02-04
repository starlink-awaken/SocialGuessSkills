import pino from 'pino';

import { config } from './config.js';

const level = config.LOG_LEVEL;

// Timestamp in ISO format, field name: timestamp
const logger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label })
  },
  base: undefined // do not include pid/hostname by default
});

// Exported helper to include requestId in child logger
export function childLogger(requestId?: string) {
  if (requestId) return logger.child({ requestId });
  return logger;
}

export { logger };

export default logger;
