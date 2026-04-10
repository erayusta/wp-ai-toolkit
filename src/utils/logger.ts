/**
 * Structured logger for the WP AI Toolkit MCP Server.
 * Outputs to stderr so it doesn't interfere with the MCP stdio transport.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.WP_TOOLKIT_LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case "DEBUG":
        this.level = LogLevel.DEBUG;
        break;
      case "WARN":
        this.level = LogLevel.WARN;
        break;
      case "ERROR":
        this.level = LogLevel.ERROR;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (level < this.level) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message,
      ...(meta && { meta }),
    };

    process.stderr.write(JSON.stringify(entry) + "\n");
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, meta);
  }
}

export const logger = new Logger();
