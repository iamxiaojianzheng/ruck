/**
 * 窗口相关类型定义
 */

import type { BrowserWindow } from 'electron';

/** 窗口配置 */
export interface WindowConfig {
    /** 窗口宽度 */
    width: number;
    /** 窗口高度 */
    height: number;
    /** 最小宽度 */
    minWidth?: number;
    /** 最大宽度 */
    maxWidth?: number;
    /** 最小高度 */
    minHeight?: number;
    /** 最大高度 */
    maxHeight?: number;
    /** 是否可调整大小 */
    resizable: boolean;
    /** 窗口标题 */
    title?: string;
    /** 是否显示 */
    show?: boolean;
    /** 背景颜色 */
    backgroundColor?: string;
}

/** 主窗口实例（扩展 Electron BrowserWindow） */
export interface MainWindowInstance extends BrowserWindow {
    /** 允许调整高度的方法 */
    setExpendHeightAllowed?: (height: number) => void;
}

/** 窗口创建选项 */
export interface BrowserWindowCreateOptions {
    /** 插件名称 */
    name: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    useContentSize?: boolean;
    resizable?: boolean;
    title?: string;
    show?: boolean;
    backgroundColor?: string;
    webPreferences?: {
        webSecurity?: boolean;
        backgroundThrottling?: boolean;
        contextIsolation?: boolean;
        webviewTag?: boolean;
        nodeIntegration?: boolean;
        spellcheck?: boolean;
        partition?: string | null;
        preload?: string;
    };
}

/** 简化的 BrowserWindow 接口 */
export interface RubickBrowserWindow {
    loadURL(url: string): void;
    on(event: 'closed' | 'ready-to-show', listener: (...args: any[]) => void): void;
    once(event: 'ready-to-show', listener: (...args: any[]) => void): void;
    show(): void;
    close(): void;
    webContents: {
        on(event: 'dom-ready', listener: (...args: any[]) => void): void;
    };
}
