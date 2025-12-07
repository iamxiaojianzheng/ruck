import path from 'path';
import fs from 'fs';
import request from 'request';
import { PluginHandler } from '@/core';
import { PLUGIN_INSTALL_DIR as baseDir, PLUGIN_INSTALL_ROOT_DIR } from '@/common/constants/main';
import API from '@/main/common/api';
import { LocalPlugin } from '@/types';

const configPath = path.join(baseDir, './rubick-local-plugin.json');
const checkDevPlugin = (plugin: LocalPlugin) => {
  const { name: pluginName, isDev } = plugin;
  const pluginPath = path.resolve(PLUGIN_INSTALL_ROOT_DIR, pluginName || '');
  console.log('pluginPath:', pluginPath);
  if (isDev && !fs.existsSync(pluginPath)) {
    throw new Error(`错误: 插件【${pluginName}】所在路径为空`);
  }
};

function downloadImage(url: string, savePath: string) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(savePath);

    // 使用 request 发送请求
    request({ url, proxy: false })
      .pipe(writeStream)
      .on('close', () => {
        // 下载完成后，触发 resolve()
        resolve('图片下载并保存成功！');
      })
      .on('error', (err) => {
        // 如果发生错误，触发 reject()
        reject('下载图片时出错: ' + err);
      });
  });
}

let registry: string;
let pluginInstance: PluginHandler;
(async () => {
  try {
    const res = await API.dbGet({
      data: {
        id: 'rubick-localhost-config',
      },
    });

    registry = res && res.data.register;
    pluginInstance = new PluginHandler({
      baseDir,
      registry,
    });
  } catch (e) {
    pluginInstance = new PluginHandler({
      baseDir,
      registry,
    });
  }
})();

global.LOCAL_PLUGINS = {
  PLUGINS: [],
  async downloadPlugin(plugin: LocalPlugin) {
    const { name: pluginName, isDev } = plugin;

    if (!pluginName) return;

    await pluginInstance.install([pluginName], { isDev });
    const pluginPath = path.resolve(PLUGIN_INSTALL_ROOT_DIR, pluginName);

    if (isDev) {
      checkDevPlugin(plugin);
      // 获取 dev 插件信息
      const pluginInfo = JSON.parse(fs.readFileSync(path.join(pluginPath, './package.json'), 'utf8'));
      plugin = { ...plugin, ...pluginInfo };
    }

    const logo = plugin.logo;
    if (logo) {
      const logoPath = path.join(pluginPath, 'logo' + path.extname(logo));
      if (/^(http|https):\/\//.test(logo)) {
        await downloadImage(logo, logoPath);
        if (fs.existsSync(logoPath)) {
          plugin.logoPath = logoPath;
        }
      } else if (fs.existsSync(logoPath)) {
        plugin.logoPath = logoPath;
      }
    }

    global.LOCAL_PLUGINS.addPlugin(plugin);
    return global.LOCAL_PLUGINS.PLUGINS;
  },
  refreshPlugin(plugin: LocalPlugin) {
    const { name: pluginName } = plugin;
    if (!pluginName) return global.LOCAL_PLUGINS.PLUGINS;

    // 获取 dev 插件信息
    const pluginPath = path.resolve(PLUGIN_INSTALL_ROOT_DIR, pluginName);
    const packagePath = path.join(pluginPath, './package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const pluginInfo = JSON.parse(packageContent);

    plugin = { ...plugin, ...pluginInfo };
    // 刷新
    let currentPlugins = global.LOCAL_PLUGINS.getLocalPlugins();

    currentPlugins = currentPlugins.map((p: LocalPlugin) => {
      if (p.name === pluginName) {
        return plugin;
      }
      return p;
    });

    // 存入
    global.LOCAL_PLUGINS.PLUGINS = currentPlugins;
    fs.writeFileSync(configPath, JSON.stringify(currentPlugins));
    return global.LOCAL_PLUGINS.PLUGINS;
  },
  getLocalPlugins() {
    try {
      if (!global.LOCAL_PLUGINS.PLUGINS.length) {
        global.LOCAL_PLUGINS.PLUGINS = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      return global.LOCAL_PLUGINS.PLUGINS;
    } catch (e) {
      global.LOCAL_PLUGINS.PLUGINS = [];
      return global.LOCAL_PLUGINS.PLUGINS;
    }
  },
  addPlugin(plugin: LocalPlugin) {
    let has = false;
    const currentPlugins = global.LOCAL_PLUGINS.getLocalPlugins();
    currentPlugins.some((p: LocalPlugin) => {
      has = p.name === plugin.name;
      return has;
    });
    if (!has) {
      currentPlugins.unshift(plugin);
      global.LOCAL_PLUGINS.PLUGINS = currentPlugins;
      fs.writeFileSync(configPath, JSON.stringify(currentPlugins));
    }
  },
  updatePlugin(plugin: LocalPlugin) {
    global.LOCAL_PLUGINS.PLUGINS = global.LOCAL_PLUGINS.PLUGINS.map((origin: LocalPlugin) => {
      if (origin.name === plugin.name) {
        return plugin;
      }
      return origin;
    });
    fs.writeFileSync(configPath, JSON.stringify(global.LOCAL_PLUGINS.PLUGINS));
  },
  async deletePlugin(plugin: LocalPlugin) {
    if (!plugin.name) return;
    await pluginInstance.uninstall([plugin.name], { isDev: plugin.isDev });
    global.LOCAL_PLUGINS.PLUGINS = global.LOCAL_PLUGINS.PLUGINS.filter((p: LocalPlugin) => plugin.name !== p.name);
    fs.writeFileSync(configPath, JSON.stringify(global.LOCAL_PLUGINS.PLUGINS));
    return global.LOCAL_PLUGINS.PLUGINS;
  },
};
