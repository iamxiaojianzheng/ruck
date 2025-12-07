/**
 * Detach 窗口相关的 IPC 处理器
 */

import type { IPCHandler } from '@/types/ipc';
import localConfig from '@/main/common/initLocalConfig';
import { BrowserWindow } from 'electron';

// Detach 窗口实例引用
let detachWindow: BrowserWindow | null = null;

/**
 * 设置 detach 窗口引用
 * 在创建 detach 窗口时调用
 */
export const setDetachWindow = (win: BrowserWindow | null) => {
    detachWindow = win;
};

/**
 * 获取配置
 */
export const getConfig: IPCHandler<'detach:getConfig'> = async () => {
    return await localConfig.getConfig();
};

/**
 * 更新插件设置
 */
export const updatePluginSetting: IPCHandler<'detach:updatePluginSetting'> = async (event, { pluginName, key, value }) => {
    const config = await localConfig.getConfig();
    if (!config.pluginSettings) {
        config.pluginSettings = {};
    }
    if (!config.pluginSettings[pluginName]) {
        config.pluginSettings[pluginName] = {};
    }
    config.pluginSettings[pluginName][key] = value;
    await localConfig.setConfig(config);
    return await localConfig.getConfig();
};

/**
 * 最小化窗口
 */
export const minimize: IPCHandler<'detach:minimize'> = () => {
    if (!detachWindow) return;
    detachWindow.focus();
    detachWindow.minimize();
};

/**
 * 最大化/取消最大化窗口
 */
export const maximize: IPCHandler<'detach:maximize'> = () => {
    if (!detachWindow) return;
    detachWindow.isMaximized() ? detachWindow.unmaximize() : detachWindow.maximize();
};

/**
 * 关闭窗口
 */
export const close: IPCHandler<'detach:close'> = () => {
    if (!detachWindow) return;
    detachWindow.close();
};

/**
 * 置顶窗口
 */
export const pin: IPCHandler<'detach:pin'> = () => {
    if (!detachWindow) return;
    detachWindow.setAlwaysOnTop(true);
};

/**
 * 取消置顶
 */
export const unpin: IPCHandler<'detach:unpin'> = () => {
    if (!detachWindow) return;
    detachWindow.setAlwaysOnTop(false);
};

/**
 * 退出全屏
 */
export const endFullScreen: IPCHandler<'detach:endFullScreen'> = () => {
    if (!detachWindow) return;
    detachWindow.isFullScreen() && detachWindow.setFullScreen(false);
};

/**
 * 处理输入变化
 * 触发子输入框变化事件
 */
export const inputChange: IPCHandler<'detach:inputChange'> = async (event, { text }) => {
    // 获取view并触发输入变化事件
    const view = detachWindow?.getBrowserView();
    if (view) {
        const evalJs = `
            if(window.rubick && window.rubick.hooks && typeof window.rubick.hooks.onSubInputChange === 'function') {
                try {
                    window.rubick.hooks.onSubInputChange({ text: ${JSON.stringify(text)} });
                } catch(e) {
                    console.log('onSubInputChange error:', e);
                }
            }
        `;
        view.webContents.executeJavaScript(evalJs);
    }
};
