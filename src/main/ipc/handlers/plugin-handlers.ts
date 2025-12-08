/**
 * 插件相关的 IPC 处理器
 */

import { BrowserWindow, Notification } from 'electron';
import type { IPCHandler } from '@/types/ipc';
import runnerInstance from '@/main/browsers/runner-instance';
import { detach } from '@/main/browsers';
import commonUtil from '@/common/utils/commonUtil';
import { registerSeparateShortcut, unregisterSeparateShortcut } from '@/main/common/registerHotKey';

const detachInstance = detach();

// 当前插件状态（从 API 类迁移）
let currentPlugin: any = null;

/**
 * 加载插件
 */
export const loadPlugin: IPCHandler<'plugin:load'> = (event, { plugin }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.executeJavaScript(`window.loadPlugin(${JSON.stringify(plugin)})`);

    // 调用 openPlugin
    openPlugin(event, { plugin });
};

/**
 * 打开插件
 */
export const openPlugin: IPCHandler<'plugin:open'> = (event, { plugin }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    // 检查平台兼容性
    if (plugin.platform && !plugin.platform.includes(process.platform)) {
        new Notification({
            title: `插件不支持当前 ${process.platform} 系统`,
            body: `插件仅支持 ${plugin.platform.join(',')}`,
            icon: plugin.logo,
        }).show();
        return;
    }

    window.setSize(window.getSize()[0], 60);
    removePlugin(event, undefined);

    // 模板文件
    if (!plugin.main) {
        plugin.tplPath = commonUtil.getTplIndex();
    }

    if (plugin.name === 'rubick-system-feature') {
        plugin.logo = plugin.logo || `file://${__static}/logo.png`;
        plugin.indexPath = commonUtil.getFeatureIndex();
    } else if (!plugin.indexPath) {
        plugin.indexPath = commonUtil.getPluginIndex(plugin, null);
    }

    runnerInstance.init(plugin, window);
    currentPlugin = plugin;

    window.webContents.executeJavaScript(
        `window.setCurrentPlugin(${JSON.stringify({ currentPlugin })})`
    );

    window.show();

    const view = runnerInstance.getView();
    if (!view.inited) {
        // ESC 键处理在主窗口统一处理
    }

    // 插件打开后，注册分离窗口快捷键
    registerSeparateShortcut();
};

/**
 * 移除插件
 */
export const removePlugin: IPCHandler<'plugin:remove'> = (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    runnerInstance.removeView(window);
    currentPlugin = null;

    // 插件关闭后，取消注册分离窗口快捷键
    unregisterSeparateShortcut();
};

/**
 * 分离插件到独立窗口
 */
export const detachPlugin: IPCHandler<'plugin:detach'> = async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !currentPlugin) return;

    window.setBrowserView(null);

    const res = await window.webContents.executeJavaScript(`window.getMainInputInfo()`);
    const pluginInfo = { ...currentPlugin, subInput: res };

    detachInstance.init(pluginInfo, window, runnerInstance);

    window.webContents.executeJavaScript(`window.initRubick()`);
    window.setSize(window.getSize()[0], 60);
    currentPlugin = null;

    // 插件分离后，主窗口已无插件，取消注册分离窗口快捷键
    unregisterSeparateShortcut();
};

/**
 * 打开插件开发者工具
 */
export const openPluginDevTools: IPCHandler<'plugin:openDevTools'> = () => {
    const view = runnerInstance.getView();
    if (view && view.webContents) {
        view.webContents.openDevTools({ mode: 'detach' });
    }
};

/**
 * 获取当前插件
 */
export function getCurrentPlugin() {
    return currentPlugin;
}

/**
 * 设置当前插件
 */
export function setCurrentPlugin(plugin: any) {
    currentPlugin = plugin;
}
