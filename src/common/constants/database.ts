/**
 * 数据库相关常量
 */

/** 数据库键常量 */
export const DB_KEYS = {
    /** 本地配置键 */
    LOCAL_CONFIG: 'localConfig',
    /** 插件历史记录键 */
    PLUGIN_HISTORY: 'rubick-plugin-history',
    /** 超级面板用户插件键 */
    SUPER_PANEL: 'super-panel-user-plugins',
    /** 本地插件键 */
    LOCAL_PLUGINS: 'ruck-local-plugins',
} as const;

/** 数据库键类型 */
export type DBKey = typeof DB_KEYS[keyof typeof DB_KEYS];
