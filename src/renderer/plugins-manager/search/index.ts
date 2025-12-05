/**
 * 搜索模块
 * 统一导出所有搜索功能
 */

export { buildPluginIndex, rebuildPluginIndex, getPluginIndex, isIndexBuilt } from './plugin-index';
export type { PluginIndexItem } from './plugin-index';

export { tryIncrementalSearch, clearIncrementalCache } from './incremental-search';
