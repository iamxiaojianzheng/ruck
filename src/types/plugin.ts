/**
 * 插件相关类型定义
 */

/** 插件基本信息 */
export interface PluginInfo {
  /** 插件类型 */
  type?: 'adapter' | 'ui';
  /** 插件应用类型 */
  pluginType?: 'ui' | 'system' | 'app';
  /** 插件唯一标识 */
  name: string;
  /** 插件显示名称 */
  pluginName: string;
  /** 插件作者 */
  author: string;
  /** 插件描述 */
  description: string;
  /** 插件简短描述（用于标识） */
  desc?: string;
  /** 插件版本 */
  version: string;
  /** 插件图标 */
  logo: string;
  /** 插件图标（别名） */
  icon?: string;
  /** 插件入口文件 */
  main?: string;
  /** 插件功能列表 */
  features?: Feature[];
  /** 是否正在加载 */
  isloading?: boolean;
  /** 原始名称（用于历史记录） */
  originName?: string;
  /** 是否固定 */
  pin?: boolean;
}

/** 插件功能定义 */
export interface Feature {
  /** 功能标识 */
  code: string;
  /** 功能说明 */
  explain: string;
  /** 触发命令列表 */
  cmds: Array<Cmd | string>;
}

/** 命令定义 */
export interface Cmd {
  /** 命令标签 */
  label: string;
  /** 命令类型 */
  type?: 'text' | 'img' | 'over' | 'file' | 'files' | 'regex';
  /** 文件类型 */
  fileType?: string;
  /** 匹配规则 */
  match?: CmdMatch;
}

/** 命令匹配规则 */
export interface CmdMatch {
  /** 应用名称列表 */
  app?: string[];
  /** 类名列表 */
  class?: string[];
}

/** 文件信息 */
export interface FileInfo {
  /** 是否为文件 */
  isFile: boolean;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 文件名 */
  name?: string;
  /** 文件绝对路径 */
  path: string | null;
  /** 图片数据的 Base64 编码 */
  dataUrl?: string;
}

/** 插件上下文 */
export interface PluginContext {
  /** 功能标识 */
  code: string;
  /** 触发类型 */
  type: 'text' | 'img' | 'files' | 'regex' | 'over' | 'window';
  /** 载荷数据 */
  payload:
  | string // text/regex/over
  | string // img (Base64)
  | FileInfo[] // files
  | Record<string, any>; // window
}

/** 插件运行状态 */
export type PluginStatus = 'RUNNING' | 'STOPPED' | 'ERROR';

/** 插件操作选项 */
export interface PluginOption {
  /** 选项名称 */
  name: string;
  /** 选项值 */
  value: string;
  /** 选项图标 */
  icon: string;
  /** 选项描述 */
  desc: string;
  /** 选项类型 */
  type: string;
  /** 匹配位置（支持多位置高亮）*/
  match: number[][] | false;
  /** 显示优先级 */
  zIndex: number;
  /** 点击回调 */
  click: () => void;
  /** logo路径 */
  logoPath?: string;
}

/** 运行时插件信息（包含运行上下文） */
export interface RuntimePlugin extends PluginInfo {
  /** 当前触发的命令文本 */
  cmd: Cmd | string;
  /** 当前触发的功能 */
  feature: Feature;
  /** 插件页面路径 */
  indexPath: string;
  /** 扩展数据（payload 等） */
  ext?: any;
  /** 模板路径 */
  tplPath?: string;
  /** 点击回调 */
  click?: () => void;
  /** 动作（APP类型） */
  action?: string;
}

/** 本地插件信息（用于插件管理） */
export interface LocalPlugin extends Partial<PluginInfo> {
  isDev?: boolean;
  logoPath?: string;
  desc?: string;
  [key: string]: any;
}
