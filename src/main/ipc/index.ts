/**
 * IPC 处理器注册中心
 * 提供类型安全的 IPC 通道注册和调用机制
 */

import { ipcMain, BrowserWindow } from 'electron';
import type { IPCChannel, IPCChannelMap, IPCHandler, IPCHandlerMap } from '@/types/ipc';

/**
 * IPC 处理器注册表
 */
class IPCRegistry {
    private handlers: Partial<IPCHandlerMap> = {};
    private initialized = false;

    /**
     * 注册 IPC 处理器
     * @param channel 通道名称
     * @param handler 处理器函数
     */
    register<T extends IPCChannel>(channel: T, handler: IPCHandler<T>): void {
        if (this.handlers[channel]) {
            console.warn(`IPC handler for channel "${channel}" already registered, overwriting...`);
        }

        // 使用类型断言避免复杂的交叉类型限制
        (this.handlers as any)[channel] = handler;

        // 注册到 Electron IPC
        ipcMain.handle(channel, async (event, request) => {
            try {
                return await handler(event, request);
            } catch (error) {
                console.error(`IPC handler error for channel "${channel}":`, error);
                throw error;
            }
        });
    }

    /**
     * 批量注册 IPC 处理器
     * @param handlers 处理器映射表
     */
    registerBatch(handlers: Partial<IPCHandlerMap>): void {
        Object.entries(handlers).forEach(([channel, handler]) => {
            this.register(channel as IPCChannel, handler as IPCHandler<any>);
        });
    }

    /**
     * 移除 IPC 处理器
     * @param channel 通道名称
     */
    unregister(channel: IPCChannel): void {
        delete this.handlers[channel];
        ipcMain.removeHandler(channel);
    }

    /**
     * 移除所有处理器
     */
    unregisterAll(): void {
        Object.keys(this.handlers).forEach((channel) => {
            ipcMain.removeHandler(channel);
        });
        this.handlers = {};
    }

    /**
     * 获取已注册的处理器
     */
    getHandler<T extends IPCChannel>(channel: T): IPCHandler<T> | undefined {
        return this.handlers[channel] as IPCHandler<T> | undefined;
    }

    /**
     * 检查通道是否已注册
     */
    hasHandler(channel: IPCChannel): boolean {
        return channel in this.handlers;
    }

    /**
     * 获取所有已注册的通道
     */
    getRegisteredChannels(): IPCChannel[] {
        return Object.keys(this.handlers) as IPCChannel[];
    }

    /**
     * 标记为已初始化
     */
    markInitialized(): void {
        this.initialized = true;
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

/**
 * 全局 IPC 注册表实例
 */
export const ipcRegistry = new IPCRegistry();

/**
 * 向渲染进程发送事件的辅助函数
 */
export function sendToRenderer<T extends keyof import('@/types/ipc').IPCEventPayloadMap>(
    window: BrowserWindow,
    channel: T,
    payload: import('@/types/ipc').IPCEventPayloadMap[T]
): void {
    if (!window || window.isDestroyed()) {
        console.warn(`Cannot send to renderer: window is destroyed (channel: ${channel})`);
        return;
    }

    window.webContents.send(channel, payload);
}

/**
 * 向所有渲染进程发送事件
 */
export function broadcastToRenderers<T extends keyof import('@/types/ipc').IPCEventPayloadMap>(
    channel: T,
    payload: import('@/types/ipc').IPCEventPayloadMap[T]
): void {
    BrowserWindow.getAllWindows().forEach((window) => {
        sendToRenderer(window, channel, payload);
    });
}

/**
 * 执行 JavaScript 代码的辅助函数（类型安全版本）
 * 减少直接使用 executeJavaScript，仅在必要时使用
 */
export async function executeInRenderer<T = any>(
    window: BrowserWindow,
    code: string
): Promise<T> {
    if (!window || window.isDestroyed()) {
        throw new Error('Cannot execute in renderer: window is destroyed');
    }

    return window.webContents.executeJavaScript(code);
}
