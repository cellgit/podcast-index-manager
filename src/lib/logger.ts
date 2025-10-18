import pino from "pino";

const serviceName = "podcast-index-manager";
const nodeEnv = process.env.NODE_ENV ?? "development";
const logLevel =
  process.env.LOG_LEVEL ??
  (nodeEnv === "production" ? "info" : "debug");

const transport =
  nodeEnv !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          singleLine: true,
        },
      }
    : undefined;

export const logger = pino({
  level: logLevel,
  base: {
    service: serviceName,
    env: nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport,
});

export type Logger = typeof logger;
