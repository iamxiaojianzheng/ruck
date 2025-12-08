import { getLocalPlugins, clearPluginCache } from '../cache';
import type { Feature, Cmd, LocalPlugin } from '@/types';
import { rendererLogger as logger } from '@/common/logger';

/**
 * 插件索引模块
 * 预构建插件索引，将 O(n³) 搜索复杂度降低到 O(n)
 */
export interface PluginIndexItem {
  plugin: LocalPlugin;
  feature: Feature;
  cmd: Cmd | string;
  cmdLabel: string;
  cmdType?: string;
}

const pluginIndex: PluginIndexItem[] = [];
let indexBuilt = false;

/**
 * 构建插件索引
 * 在初始化时调用一次，避免每次搜索都遍历所有插件
 */
export function buildPluginIndex() {
  if (indexBuilt) return; // 已构建，避免重复

  pluginIndex.length = 0; // 清空现有索引
  const localPlugins = getLocalPlugins();

  localPlugins.forEach((plugin) => {
    const features = plugin.features;
    if (!features) return;

    for (const feature of features) {
      if (!feature.cmds) continue;

      for (const cmd of feature.cmds) {
        let cmdLabel: string;
        let cmdType: string | undefined;

        if (typeof cmd === 'string') {
          cmdLabel = cmd;
        } else {
          cmdLabel = cmd.label;
          cmdType = cmd.type;
        }

        pluginIndex.push({
          plugin,
          feature,
          cmd,
          cmdLabel,
          cmdType,
        });
      }
    }
  });

  indexBuilt = true;
  logger.info('插件索引构建完成', { count: pluginIndex.length });
}

/**
 * 重建索引（当插件列表更新时）
 */
export function rebuildPluginIndex() {
  indexBuilt = false;
  clearPluginCache();
  buildPluginIndex();
}

/**
 * 获取插件索引
 */
export function getPluginIndex(): PluginIndexItem[] {
  if (!indexBuilt) {
    buildPluginIndex();
  }
  return pluginIndex;
}

/**
 * 检查索引是否已构建
 */
export function isIndexBuilt() {
  return indexBuilt;
}
