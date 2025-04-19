import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { config } from "../config";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(process.cwd(), "logs", "app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: config.logging.maxFiles,
  level: config.logging.level,
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  level: config.logging.level,
});

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: "api-service" },
  transports: [
    consoleTransport,
    ...(config.server.nodeEnv === "production" ? [fileTransport] : []),
  ],
  exitOnError: false,
});

export const requestLogFormat = (req: any, res: any) => {
  const statusCode = res.statusCode;
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const userId = req.user?.id || "unauthenticated";

  return {
    timestamp: new Date().toISOString(),
    statusCode,
    method,
    url,
    ip,
    userAgent,
    userId,
    responseTime: res.responseTime || undefined,
  };
};

export const createServiceLogger = (serviceName: string) => {
  return {
    error: (message: string, meta: Record<string, any> = {}) => {
      logger.error(message, { service: serviceName, ...meta });
    },
    warn: (message: string, meta: Record<string, any> = {}) => {
      logger.warn(message, { service: serviceName, ...meta });
    },
    info: (message: string, meta: Record<string, any> = {}) => {
      logger.info(message, { service: serviceName, ...meta });
    },
    http: (message: string, meta: Record<string, any> = {}) => {
      logger.http(message, { service: serviceName, ...meta });
    },
    debug: (message: string, meta: Record<string, any> = {}) => {
      logger.debug(message, { service: serviceName, ...meta });
    },
  };
};

export const dbLogger = createServiceLogger("database");

export const authLogger = createServiceLogger("auth");

export const bookingLogger = createServiceLogger("booking");

export default logger;
