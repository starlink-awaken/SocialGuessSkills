import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:standard',
      colorize: true,
    },
  },
});

// Exported helper to include requestId in child logger
export function childLogger(requestId?: string) {
  if (requestId) return logger.child({ requestId });
  return logger;
}

export { logger };

export default logger;
