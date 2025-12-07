/**
 * 窗口相关的 IPC 处理器
 */

import { BrowserWindow, screen } from 'electron';
import type { IPCHandler } from '@/types/ipc';
import mainInstance from '@/main/index';
import getWinPosition from '@/main/common/getWinPosition';

/**
 * 获取当前窗口（从事件源）
 */
function getCurrentWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
    return BrowserWindow.fromWebContents(event.sender);
}

/**
 * 隐藏窗口
 */
export const hideWindow: IPCHandler<'window:hide'> = (event) => {
    const window = getCurrentWindow(event);
    if (window) {
        window.hide();
    }
};

/**
 * 显示窗口
 */
export const showWindow: IPCHandler<'window:show'> = (event) => {
    const window = getCurrentWindow(event);
    if (window) {
        window.show();
    }
};

/**
 * 隐藏主窗口
 */
export const hideMainWindow: IPCHandler<'window:hideMain'> = () => {
    const mainWindow = mainInstance.windowCreator.getWindow();
    if (mainWindow) {
        mainWindow.hide();
    }
};

/**
 * 显示主窗口
 */
export const showMainWindow: IPCHandler<'window:showMain'> = () => {
    const mainWindow = mainInstance.windowCreator.getWindow();
    if (mainWindow) {
        mainWindow.show();
    }
};

/**
 * 设置窗口扩展高度
 */
export const setExpendHeight: IPCHandler<'window:setExpendHeight'> = (event, { height }) => {
    const window = getCurrentWindow(event);
    if (!window) return;

    const targetHeight = height;
    const currentSize = window.getSize();

    // 使用允许调整的方法
    if ((window as any).setExpendHeightAllowed) {
        (window as any).setExpendHeightAllowed(targetHeight);
    } else {
        // 回退方案
        window.setSize(currentSize[0], targetHeight);
    }

    const screenPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(screenPoint);
    const position = window.getPosition()[1] + targetHeight > display.bounds.height ? height - 60 : 0;

    // 通过事件发送位置信息
    window.webContents.send('ui:setPosition', position);
};

/**
 * 移动窗口
 */
export const windowMoving: IPCHandler<'window:moving'> = (event, { mouseX, mouseY, width, height }) => {
    const window = getCurrentWindow(event);
    if (!window) return;

    const { x, y } = screen.getCursorScreenPoint();
    window.setBounds({ x: x - mouseX, y: y - mouseY, width, height });
    getWinPosition.setPosition(x - mouseX, y - mouseY);
};

/**
 * 获取窗口位置
 */
export const getWindowPosition: IPCHandler<'window:getPosition'> = (event) => {
    const window = getCurrentWindow(event);
    if (!window) {
        return { x: 0, y: 0 };
    }

    const [x, y] = window.getPosition();
    return { x, y };
};
