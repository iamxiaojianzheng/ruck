/**
 * 日志配置模块
 *
 * 定义日志系统的配置参数，包括日志级别、文件路径、格式等。
 */

import { app } from 'electron';
import path from 'path';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 日志级别 */
  level: LogLevel;
  /** 是否输出到控制台 */
  console: boolean;
  /** 是否输出到文件 */
  file: boolean;
  /** 日志文件目录 */
  logDir: string;
  /** 是否为开发环境 */
  isDev: boolean;
}

/**
 * 获取日志文件目录
 */
function getLogDirectory(): string {
  try {
    // 尝试获取 app 路径（主进程）
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'logs');
  } catch (error) {
    // 渲染进程中无法访问 app，使用临时目录
    const tempDir = process.platform === 'win32' ? process.env.TEMP || 'C:\\temp' : '/tmp';
    return path.join(tempDir, 'ruck-logs');
  }
}

/**
 * 默认日志配置
 */
export const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  console: true,
  file: process.env.NODE_ENV === 'production',
  logDir: getLogDirectory(),
  isDev: process.env.NODE_ENV !== 'production',
};

/**
 * 获取日志配置
 * 可以根据环境变量或用户设置覆盖默认配置
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    ...defaultConfig,
    // 可以从环境变量或配置文件中读取自定义配置
    level: (process.env.LOG_LEVEL as LogLevel) || defaultConfig.level,
  };
}
