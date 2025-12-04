/**
 * 应用配置相关类型定义
 */

/** 应用配置 */
export interface AppConfig {
    /** 性能配置 */
    perf: PerfConfig;
    /** 全局配置 */
    global: GlobalConfig;
    /** 本地配置 */
    local: LocalConfig;
}

/** 性能配置 */
export interface PerfConfig {
    /** 通用配置 */
    common: {
        /** 是否显示历史记录 */
        history: boolean;
        /** 失焦时是否隐藏 */
        hideOnBlur: boolean;
        /** 是否启用空格触发 */
        space: boolean;
    };
    /** 开发者配置 */
    dev: {
        /** 是否启用热重载 */
        hotReload: boolean;
    };
}

/** 全局配置 */
export interface GlobalConfig {
    /** 显示/隐藏快捷键 */
    showAndHidden: string;
    /** 分离快捷键 */
    separate: string;
    /** 退出快捷键 */
    quit: string;
}

/** 本地配置 */
export interface LocalConfig {
    /** 启动路径 */
    start: string[];
}

/** 配置键类型 */
export type ConfigKey = 'perf' | 'global' | 'local';
