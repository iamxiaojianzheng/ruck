/**
 * 日志模块主文件
 *
 * 提供统一的日志接口，导出预配置的 logger 实例。
 *
 * @example
 * ```typescript
 * import { mainLogger } from '@/common/logger';
 *
 * mainLogger.info('应用启动', { version: '1.0.0' });
 * mainLogger.error('发生错误', { error: err.message });
 * ```
 */

import winston from 'winston';
import { getLoggerConfig, LogLevel } from './config';
import { getTransports } from './transports';

/**
 * 创建 Logger 实例
 *
 * @param context 上下文名称，用于标识日志来源
 * @returns winston Logger 实例
 */
export function createLogger(context: string): winston.Logger {
  const config = getLoggerConfig();
  const transports = getTransports(config);

  const logger = winston.createLogger({
    level: config.level,
    transports,
    // 默认元数据
    defaultMeta: { context },
  });

  return logger;
}

/**
 * 主进程 Logger
 *
 * 用于主进程的日志记录
 */
export const mainLogger = createLogger('Main');

/**
 * 渲染进程 Logger
 *
 * 用于渲染进程的日志记录
 */
export const rendererLogger = createLogger('Renderer');

/**
 * 插件系统 Logger
 *
 * 用于插件系统的日志记录
 */
export const pluginLogger = createLogger('Plugin');

/**
 * 导出日志级别枚举
 */
export { LogLevel };

/**
 * 导出默认的主进程 logger
 */
export default mainLogger;
