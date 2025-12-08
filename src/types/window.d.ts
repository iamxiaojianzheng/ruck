/// <reference types="node" />

/**
 * Window 全局对象类型扩展
 */

// 确保此文件被视为模块，以便全局类型扩展生效
export { };

declare global {
    /**
     * 新的类型安全 IPC API
     */
    interface RuckAPI {
        // ==================== 窗口操作 ====================
        hideWindow(): Promise<void>;
        showWindow(): Promise<void>;
        hideMainWindow(): Promise<void>;
        showMainWindow(): Promise<void>;
        setExpendHeight(height: number): Promise<void>;
        windowMoving(mouseX: number, mouseY: number, width: number, height: number): Promise<void>;
        getWindowPosition(): Promise<{ x: number; y: number }>;

        // ==================== 插件操作 ====================
        loadPlugin(plugin: any): Promise<void>;
        openPlugin(plugin: any): Promise<void>;
        removePlugin(): Promise<void>;
        detachPlugin(): Promise<void>;
        openPluginDevTools(): Promise<void>;

        // ==================== 数据库操作 ====================
        dbGet(id: string): Promise<any>;
        dbPut(data: any): Promise<any>;
        dbRemove(doc: any): Promise<any>;
        dbBulkDocs(docs: any[]): Promise<any>;
        dbAllDocs(key?: string): Promise<any>;

        // ==================== 系统操作 ====================
        getPath(name: string): Promise<string>;
        shellShowItemInFolder(path: string): Promise<boolean>;
        isDev(): Promise<boolean>;
        getFileIcon(path: string): Promise<string>;

        // ==================== 子输入框 ====================
        setSubInput(placeholder?: string): Promise<void>;
        removeSubInput(): Promise<void>;
        setSubInputValue(text: string): Promise<void>;
    }

    /**
     * Detach 窗口专用 API
     */
    interface DetachAPI {
        // 系统操作
        isDev(): Promise<boolean>;
        openDevTools(): Promise<void>;

        // Detach 窗口操作
        getConfig(): Promise<any>;
        updatePluginSetting(pluginName: string, key: string, value: any): Promise<any>;
        minimize(): Promise<void>;
        maximize(): Promise<void>;
        close(): Promise<void>;
        pin(): Promise<void>;
        unpin(): Promise<void>;
        endFullScreen(): Promise<void>;
        detachInputChange(text: string): Promise<void>;
    }

    /**
     * 扩展 Window 接口
     */
    interface Window {
        /**
         * 新的类型安全 IPC API（主渲染进程）
         */
        ruckAPI: RuckAPI;

        /**
         * Detach 窗口专用 IPC API
         */
        detachAPI: DetachAPI;
    }
}
