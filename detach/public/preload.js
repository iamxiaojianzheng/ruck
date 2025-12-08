const { ipcRenderer } = require('electron');

const ipcInvoke = async (channel, data) => {
    try {
        return await ipcRenderer.invoke(channel, data);
    } catch (error) {
        console.error(`IPC invoke error on channel "${channel}":`, error);
        throw error;
    }
};

window.detachAPI = {
    // System
    isDev: async () => {
        return await ipcInvoke('system:isDev');
    },
    openDevTools: async () => {
        return await ipcInvoke('plugin:openDevTools');
    },

    // Detach Window Operations
    getConfig: async () => {
        return await ipcInvoke('detach:getConfig');
    },
    updatePluginSetting: async (pluginName, key, value) => {
        return await ipcInvoke('detach:updatePluginSetting', { pluginName, key, value });
    },
    minimize: async () => {
        return await ipcInvoke('detach:minimize');
    },
    maximize: async () => {
        return await ipcInvoke('detach:maximize');
    },
    close: async () => {
        return await ipcInvoke('detach:close');
    },
    pin: async () => {
        return await ipcInvoke('detach:pin');
    },
    unpin: async () => {
        return await ipcInvoke('detach:unpin');
    },
    endFullScreen: async () => {
        return await ipcInvoke('detach:endFullScreen');
    },
    detachInputChange: async (text) => {
        return await ipcInvoke('detach:inputChange', { text });
    }
};
