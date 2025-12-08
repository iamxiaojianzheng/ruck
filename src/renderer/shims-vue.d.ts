/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'main' {
  export function main(): any;
}

declare const __static: string;

declare module 'lodash.throttle';

interface RunnerBrowser {
  init: (plugin: any, window: BrowserWindow) => void;
  getView: () => BrowserView;
  closeView: () => void;
  removeView: (window: BrowserWindow) => void;
  executeHooks: (hook: string, data: any) => void;
}

interface Window {
  rubick: any;
  ruckAPI: RuckAPI;
  detachAPI: DetachAPI;
  setSubInput: ({ placeholder }: { placeholder: string }) => void;
  setSubInputValue: ({ value }: { value: string }) => void;
  removeSubInput: () => void;
  subInputReadonly: (value: boolean) => void;
  loadPlugin: (plugin: any) => void;
  updatePlugin: (plugin: any) => void;
  initRubick: () => void;
  addLocalStartPlugin: (plugin: any) => void;
  removeLocalStartPlugin: (plugin: any) => void;
  setCurrentPlugin: (plugin: any) => void;
  pluginLoaded: () => void;
  getMainInputInfo: () => any;
  searchFocus: (args: any, strict?: boolean) => any;
}

/**
 * 新的类型安全 IPC API
 */
interface RuckAPI {
  // 窗口操作
  hideWindow(): Promise<void>;
  showWindow(): Promise<void>;
  hideMainWindow(): Promise<void>;
  showMainWindow(): Promise<void>;
  setExpendHeight(height: number): Promise<void>;
  windowMoving(mouseX: number, mouseY: number, width: number, height: number): Promise<void>;
  getWindowPosition(): Promise<{ x: number; y: number }>;

  // 插件操作
  loadPlugin(plugin: any): Promise<void>;
  openPlugin(plugin: any): Promise<void>;
  removePlugin(): Promise<void>;
  detachPlugin(): Promise<void>;
  openPluginDevTools(): Promise<void>;

  // 数据库操作
  dbGet(id: string): Promise<any>;
  dbPut(data: any): Promise<any>;
  dbRemove(doc: any): Promise<any>;
  dbBulkDocs(docs: any[]): Promise<any>;
  dbAllDocs(key?: string): Promise<any>;

  // 系统操作
  getPath(name: string): Promise<string>;
  shellShowItemInFolder(path: string): Promise<boolean>;
  isDev(): Promise<boolean>;
  getFileIcon(path: string): Promise<string>;

  // 子输入框
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
