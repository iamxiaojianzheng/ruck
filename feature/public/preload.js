const remote = require('@electron/remote');
const { ipcRenderer } = require('electron');

/**
 * 类型安全的 IPC 调用封装（使用新的 IPC 通道）
 */
const ipcInvoke = async (channel, data) => {
  try {
    return await ipcRenderer.invoke(channel, data);
  } catch (error) {
    console.error(`IPC invoke error on channel "${channel}":`, error);
    throw error;
  }
};

window.market = {
  getLocalPlugins() {
    return remote.getGlobal('LOCAL_PLUGINS').getLocalPlugins();
  },
  downloadPlugin(plugin) {
    return remote.getGlobal('LOCAL_PLUGINS').downloadPlugin(plugin);
  },
  deletePlugin(plugin) {
    return remote.getGlobal('LOCAL_PLUGINS').deletePlugin(plugin);
  },
  refreshPlugin(plugin) {
    return remote.getGlobal('LOCAL_PLUGINS').refreshPlugin(plugin);
  },
  // 使用新的 IPC 通道
  async addLocalStartPlugin(plugin) {
    await ipcInvoke('localStart:add', { plugin });
  },
  async removeLocalStartPlugin(plugin) {
    await ipcInvoke('localStart:remove', { plugin });
  },
  async dbDump(target) {
    await ipcInvoke('db:dump', { target });
  },
  async dbImport(target) {
    await ipcInvoke('db:import', { target });
  },
};

// 暴露重新注册快捷键的方法
window.reRegisterHotKey = async () => {
  await ipcInvoke('system:reRegisterHotKey');
};
