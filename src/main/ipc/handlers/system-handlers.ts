/**
 * 系统相关的 IPC 处理器
 */

import { app, shell, Notification } from 'electron';
import ks from 'node-key-sender';
import type { IPCHandler } from '@/types/ipc';
import commonConst from '@/common/utils/commonConst';
import { screenCapture } from '@/core';
import { getCurrentPlugin } from './plugin-handlers';
import runnerInstance from '@/main/browsers/runner-instance';

/**
 * 获取系统路径
 */
export const getPath: IPCHandler<'system:getPath'> = (event, { name }) => {
    return app.getPath(name as any);
};

/**
 * 在文件管理器中显示文件
 */
export const shellShowItemInFolder: IPCHandler<'system:shellShowItemInFolder'> = (event, { path }) => {
    shell.showItemInFolder(path);
    return true;
};

/**
 * 播放系统提示音
 */
export const shellBeep: IPCHandler<'system:shellBeep'> = () => {
    shell.beep();
    return true;
};

/**
 * 获取文件图标
 */
export const getFileIcon: IPCHandler<'system:getFileIcon'> = async (event, { path }) => {
    const nativeImage = await app.getFileIcon(path, { size: 'normal' });
    return nativeImage.toDataURL();
};

/**
 * 模拟键盘按键
 */
export const simulateKeyboardTap: IPCHandler<'system:simulateKeyboardTap'> = (event, { key, modifier }) => {
    let keys = [key.toLowerCase()];
    if (modifier && Array.isArray(modifier) && modifier.length > 0) {
        keys = modifier.concat(keys);
        ks.sendCombination(keys);
    } else {
        ks.sendKeys(keys);
    }
};

/**
 * 屏幕截图
 */
export const handleScreenCapture: IPCHandler<'system:screenCapture'> = (event) => {
    const window = require('electron').BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    screenCapture(window, (img) => {
        runnerInstance.executeHooks('ScreenCapture', {
            data: img,
        });
    });
};

/**
 * 获取本地设备 ID
 */
export const getLocalId: IPCHandler<'system:getLocalId'> = () => {
    return encodeURIComponent(app.getPath('home'));
};

/**
 * 检查是否为开发环境
 */
export const isDev: IPCHandler<'system:isDev'> = () => {
    return commonConst.dev();
};

/**
 * 显示通知
 */
export const showNotification: IPCHandler<'notification:show'> = (event, { body }) => {
    if (!Notification.isSupported()) return;

    const bodyStr = typeof body !== 'string' ? String(body) : body;
    const plugin = getCurrentPlugin();

    const notify = new Notification({
        title: plugin ? plugin.pluginName : 'Ruck',
        body: bodyStr,
        icon: plugin ? plugin.logo : undefined,
    });

    notify.show();
};

/**
 * 重新注册全局快捷键
 */
export const reRegisterHotKey: IPCHandler<'system:reRegisterHotKey'> = () => {
    // 触发原有的 re-register 事件
    const { ipcMain } = require('electron');
    ipcMain.emit('re-register');
};

