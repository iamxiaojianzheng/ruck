/**
 * 窗口相关常量
 */

/** 窗口配置常量 */
export const WINDOW_CONFIG = {
  /** 主窗口宽度 */
  WIDTH: 900,
  /** 主窗口初始高度 */
  HEIGHT: 60,
  /** 最小高度 */
  MIN_HEIGHT: 60,
  /** 最大高度 */
  MAX_HEIGHT: 900,
  /** 插件窗口高度 */
  PLUGIN_HEIGHT: 600,
} as const;

/** 引导窗口配置常量 */
export const GUIDE_CONFIG = {
  /** 引导窗口宽度 */
  WIDTH: 900,
  /** 引导窗口高度 */
  HEIGHT: 600,
} as const;

/** 窗口高度相关常量 */
export const WINDOW_HEIGHT_CONFIG = {
  /** 最大高度 */
  MAX: 620,
  /** 最小高度 */
  MIN: 60,
  /** 每项高度 */
  PER_ITEM: 70,
  /** 历史记录项高度 */
  HISTORY_ITEM: 70,
  /** 每排历史记录数 */
  HISTORY_ITEMS_PER_ROW: 8,
  /** 最大历史记录行数 */
  MAX_HISTORY_ROWS: 3,
} as const;

/** 窗口配置键类型 */
export type WindowConfigKey = keyof typeof WINDOW_CONFIG;
export type GuideConfigKey = keyof typeof GUIDE_CONFIG;
