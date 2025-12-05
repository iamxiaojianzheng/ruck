import { getGlobal } from '@electron/remote';

/**
 * 插件列表缓存
 * 减少跨进程调用，提升性能
 */

let cachedLocalPlugins: any[] | null = null;
let pluginCacheTime = 0;
const PLUGIN_CACHE_TTL = 10000; // 10秒缓存

/**
 * 获取本地插件列表（带缓存）
 */
export function getLocalPlugins() {
  const now = Date.now();
  if (cachedLocalPlugins && now - pluginCacheTime < PLUGIN_CACHE_TTL) {
    return cachedLocalPlugins;
  }
  cachedLocalPlugins = getGlobal('LOCAL_PLUGINS').getLocalPlugins();
  pluginCacheTime = now;
  return cachedLocalPlugins;
}

/**
 * 清除插件缓存
 */
export function clearPluginCache() {
  cachedLocalPlugins = null;
}
