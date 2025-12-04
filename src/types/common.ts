/**
 * 通用类型定义
 */

/** 屏幕坐标点 */
export interface Point {
    x: number;
    y: number;
}

/** 显示器信息 */
export interface Display {
    id: number;
    /** 显示器边界 */
    bounds: { x: number; y: number; width: number; height: number };
    /** 工作区 */
    workArea: { x: number; y: number; width: number; height: number };
    /** 缩放比例 */
    scaleFactor: number;
    rotation: number;
    touchSupport: 'available' | 'unavailable' | 'unknown';
}

/** 对话框选项 */
export interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory'>;
}

/** 保存对话框选项 */
export interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
}

/** API 通用响应格式 */
export interface APIResponse<T = void> {
    success: boolean;
    data?: T;
    error?: APIError;
}

/** API 错误 */
export interface APIError {
    code: string;
    message: string;
    details?: any;
}

/** API 结果 */
export interface APIResult<T = any> {
    ok: boolean;
    data?: T;
    error?: APIError;
}
