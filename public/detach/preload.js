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

/**
 * Detach 窗口专用 API
 */
window.detachAPI = {
    // 系统操作
    async isDev() {
        return await ipcInvoke('system:isDev');
    },

    async openDevTools() {
        await ipcInvoke('plugin:openDevTools');
    },

    // Detach 窗口操作
    async getConfig() {
        return await ipcInvoke('detach:getConfig');
    },

    async updatePluginSetting(pluginName, key, value) {
        return await ipcInvoke('detach:updatePluginSetting', { pluginName, key, value });
    },

    async minimize() {
        await ipcInvoke('detach:minimize');
    },

    async maximize() {
        await ipcInvoke('detach:maximize');
    },

    async close() {
        await ipcInvoke('detach:close');
    },

    async pin() {
        await ipcInvoke('detach:pin');
    },

    async unpin() {
        await ipcInvoke('detach:unpin');
    },

    async endFullScreen() {
        await ipcInvoke('detach:endFullScreen');
    },

    async detachInputChange(text) {
        await ipcInvoke('detach:inputChange', { text });
    },
};
