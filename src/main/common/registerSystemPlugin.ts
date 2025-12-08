/* eslint-disable */
import path from 'path';
import fs from 'fs';
import { PLUGIN_INSTALL_DIR } from '@/common/constants/main';
import { mainLogger as logger } from '@/common/logger';

export default () => {
  // 读取所有插件
  const totalPlugins = global.LOCAL_PLUGINS.getLocalPlugins();
  let systemPlugins = totalPlugins.filter((plugin) => plugin.pluginType === 'system');
  systemPlugins = systemPlugins
    .map((plugin) => {
      try {
        const pluginPath = path.resolve(PLUGIN_INSTALL_DIR, 'node_modules', plugin.name);
        return {
          ...plugin,
          indexPath: path.join(pluginPath, './', plugin.entry),
        };
      } catch (e) {
        return false;
      }
    })
    .filter(Boolean);

  const hooks = {
    onReady: [],
  };

  systemPlugins.forEach((plugin) => {
    if (fs.existsSync(plugin.indexPath)) {
      const pluginModule = __non_webpack_require__(plugin.indexPath)();
      // @ts-ignore
      hooks.onReady.push(pluginModule.onReady);
    }
  });

  const triggerReadyHooks = (ctx) => {
    // @ts-ignore
    hooks.onReady.forEach((hook: any) => {
      try {
        hook && hook(ctx);
      } catch (e) {
        logger.error('系统插件 onReady 钩子执行失败', {
          error: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
        });
      }
    });
  };

  return {
    triggerReadyHooks,
  };
};
