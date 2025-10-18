import pino from "pino";

const serviceName = "podcast-index-manager";
const nodeEnv = process.env.NODE_ENV ?? "development";
const logLevel =
  process.env.LOG_LEVEL ??
  (nodeEnv === "production" ? "info" : "debug");

export const logger = pino({
  level: logLevel,
  base: {
    service: serviceName,
    env: nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
