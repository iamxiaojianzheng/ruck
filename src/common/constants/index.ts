/**
 * 常量统一导出入口
 */

// 窗口常量
export * from './window';

// 数据库常量
export * from './database';

// 插件常量
export * from './plugin';

// 注意：键盘映射（DECODE_KEY, PLUGIN_INSTALL_DIR 等）在 constans/main.ts 中
// 这些常量包含运行时路径，仅供主进程使用，不在此处导出
