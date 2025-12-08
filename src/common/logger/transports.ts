/**
 * 日志传输方式模块
 *
 * 配置 winston 的传输方式，包括控制台输出和文件输出。
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggerConfig } from './config';

/**
 * 创建控制台传输
 *
 * 开发环境使用彩色输出，便于调试。
 */
export function createConsoleTransport(config: LoggerConfig): winston.transport {
  return new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const contextStr = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `[${timestamp}] ${level} ${contextStr} ${message}${metaStr}`;
      })
    ),
  });
}

/**
 * 创建文件传输（综合日志）
 *
 * 所有级别的日志都会写入这个文件，使用 JSON 格式便于后续分析。
 */
export function createFileTransport(config: LoggerConfig): winston.transport {
  return new DailyRotateFile({
    dirname: config.logDir,
    filename: 'ruck-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m', // 单个文件最大 20MB
    maxFiles: '7d', // 保留 7 天的日志
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  });
}

/**
 * 创建错误文件传输
 *
 * 仅记录 ERROR 级别的日志，便于快速定位错误。
 */
export function createErrorFileTransport(config: LoggerConfig): winston.transport {
  return new DailyRotateFile({
    dirname: config.logDir,
    filename: 'ruck-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d', // 错误日志保留 14 天
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  });
}

/**
 * 获取所有传输方式
 */
export function getTransports(config: LoggerConfig): winston.transport[] {
  const transports: winston.transport[] = [];

  // 控制台传输
  if (config.console) {
    transports.push(createConsoleTransport(config));
  }

  // 文件传输
  if (config.file) {
    transports.push(createFileTransport(config));
    transports.push(createErrorFileTransport(config));
  }

  return transports;
}
