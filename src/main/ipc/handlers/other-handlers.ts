/**
 * 对话框、功能管理等其他 IPC 处理器
 */

import { dialog, BrowserWindow } from 'electron';
import type { IPCHandler } from '@/types/ipc';
import { getCurrentPlugin, setCurrentPlugin } from './plugin-handlers';
import { runner } from '@/main/browsers';

const runnerInstance = runner();

// ==================== 对话框 ====================

/**
 * 显示打开文件对话框
 */
export const showOpenDialog: IPCHandler<'dialog:showOpen'> = (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return undefined;

    return dialog.showOpenDialogSync(window, options);
};

/**
 * 显示保存文件对话框
 */
export const showSaveDialog: IPCHandler<'dialog:showSave'> = (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return undefined;

    return dialog.showSaveDialogSync(window, options);
};

// ==================== 功能管理 ====================

/**
 * 获取当前插件的所有功能
 */
export const getFeatures: IPCHandler<'feature:get'> = () => {
    const plugin = getCurrentPlugin();
    return plugin?.features || [];
};

/**
 * 添加功能
 */
export const setFeature: IPCHandler<'feature:set'> = (event, { feature }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;

    const plugin = getCurrentPlugin();
    if (!plugin) return false;

    let has = false;
    plugin.features.some((f: any) => {
        has = f.code === feature.code;
        return has;
    });

    if (!has) {
        plugin.features.push(feature);
        setCurrentPlugin({
            ...plugin,
            features: plugin.features,
        });
    }

    window.webContents.executeJavaScript(
        `window.updatePlugin(${JSON.stringify({
            currentPlugin: plugin,
        })})`
    );

    return true;
};

/**
 * 移除功能
 */
export const removeFeature: IPCHandler<'feature:remove'> = (event, { code }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;

    const plugin = getCurrentPlugin();
    if (!plugin) return false;

    const updatedPlugin = {
        ...plugin,
        features: plugin.features.filter((feature: any) => {
            if (code.type) {
                return feature.code.type !== code.type;
            }
            return feature.code !== code;
        }),
    };

    setCurrentPlugin(updatedPlugin);

    window.webContents.executeJavaScript(
        `window.updatePlugin(${JSON.stringify({
            currentPlugin: updatedPlugin,
        })})`
    );

    return true;
};

// ==================== 子输入框 ====================

/**
 * 设置子输入框
 */
export const setSubInput: IPCHandler<'subInput:set'> = (event, { placeholder }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.send('ui:setSubInput', { placeholder });
};

/**
 * 移除子输入框
 */
export const removeSubInput: IPCHandler<'subInput:remove'> = (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.send('ui:removeSubInput');
};

/**
 * 设置子输入框的值
 */
export const setSubInputValue: IPCHandler<'subInput:setValue'> = (event, { text }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.send('ui:setSubInputValue', { value: text });

    // 触发 onChange 事件
    runnerInstance.executeHooks('SubInputChange', { text });
};

/**
 * 设置子输入框只读状态
 */
export const subInputReadonly: IPCHandler<'subInput:readonly'> = (event, { readonly }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.send('ui:subInputReadonly', readonly);
};

/**
 * 子输入框失焦
 */
export const subInputBlur: IPCHandler<'subInput:blur'> = () => {
    const view = runnerInstance.getView();
    if (view && view.webContents) {
        view.webContents.focus();
    }
};

/**
 * 子输入框内容变化
 */
export const subInputOnChange: IPCHandler<'subInput:onChange'> = (event, { text }) => {
    runnerInstance.executeHooks('SubInputChange', { text });
};

// ==================== 本地启动插件 ====================

/**
 * 添加本地启动插件
 */
export const addLocalStartPlugin: IPCHandler<'localStart:add'> = (event, { plugin }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.executeJavaScript(
        `window.addLocalStartPlugin(${JSON.stringify({ plugin })})`
    );
};

/**
 * 移除本地启动插件
 */
export const removeLocalStartPlugin: IPCHandler<'localStart:remove'> = (event, { plugin }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    window.webContents.executeJavaScript(
        `window.removeLocalStartPlugin(${JSON.stringify({ plugin })})`
    );
};

// ==================== 渲染进程就绪 ====================

/**
 * 渲染进程初始化完成
 */
export const rendererReady: IPCHandler<'renderer:ready'> = () => {
    const mainInstance = require('@/main/index').default;
    mainInstance.setRendererReady(true);
    return { success: true };
};
