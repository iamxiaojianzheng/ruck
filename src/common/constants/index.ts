/**
 * 常量统一导出入口
 */

// 窗口常量
export * from './window';

// 数据库常量
export * from './database';

// 插件常量
export * from './plugin';

// 键盘映射（保留原路径兼容性）
export { DECODE_KEY, PLUGIN_INSTALL_DIR, PLUGIN_INSTALL_ROOT_DIR } from '../constans/main';
