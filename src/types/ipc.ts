/**
 * IPC 通信类型定义
 * 定义所有主进程和渲染进程之间的通信通道和消息格式
 */

import { BrowserWindow } from 'electron';

// ==================== 通道名称定义 ====================

/**
 * 所有 IPC 通道的统一定义
 * 使用字符串字面量类型确保类型安全
 */
export type IPCChannel =
  // 窗口操作
  | 'window:hide'
  | 'window:show'
  | 'window:hideMain'
  | 'window:showMain'
  | 'window:setExpendHeight'
  | 'window:moving'
  | 'window:getPosition'
  // 插件操作
  | 'plugin:load'
  | 'plugin:open'
  | 'plugin:remove'
  | 'plugin:detach'
  | 'plugin:openDevTools'
  | 'plugin:sendKeyDown'
  // 数据库操作
  | 'db:put'
  | 'db:get'
  | 'db:remove'
  | 'db:bulkDocs'
  | 'db:allDocs'
  | 'db:dump'
  | 'db:import'
  | 'db:postAttachment'
  | 'db:getAttachment'
  | 'db:getAttachmentType'
  // 对话框
  | 'dialog:showOpen'
  | 'dialog:showSave'
  // 剪贴板
  | 'clipboard:copyImage'
  | 'clipboard:copyText'
  | 'clipboard:copyFile'
  | 'clipboard:getFiles'
  // 通知
  | 'notification:show'
  // 子输入框
  | 'subInput:set'
  | 'subInput:remove'
  | 'subInput:setValue'
  | 'subInput:readonly'
  | 'subInput:blur'
  | 'subInput:onChange'
  // 系统操作
  | 'system:getPath'
  | 'system:shellShowItemInFolder'
  | 'system:shellBeep'
  | 'system:getFileIcon'
  | 'system:simulateKeyboardTap'
  | 'system:screenCapture'
  | 'system:getLocalId'
  | 'system:isDev'
  | 'system:reRegisterHotKey'
  // 功能管理
  | 'feature:get'
  | 'feature:set'
  | 'feature:remove'
  // 本地启动插件
  | 'localStart:add'
  | 'localStart:remove'
  // Detach 窗口操作
  | 'detach:getConfig'
  | 'detach:updatePluginSetting'
  | 'detach:minimize'
  | 'detach:maximize'
  | 'detach:close'
  | 'detach:pin'
  | 'detach:unpin'
  | 'detach:endFullScreen'
  | 'detach:inputChange'
  | 'detach:openDevTools'
  // 渲染进程就绪通知
  | 'renderer:ready';

// ==================== 请求/响应类型映射 ====================

/**
 * 每个通道对应的请求和响应类型
 */
export interface IPCChannelMap {
  // 窗口操作
  'window:hide': { request: void; response: void };
  'window:show': { request: void; response: void };
  'window:hideMain': { request: void; response: void };
  'window:showMain': { request: void; response: void };
  'window:setExpendHeight': {
    request: { height: number };
    response: void;
  };
  'window:moving': {
    request: { mouseX: number; mouseY: number; width: number; height: number };
    response: void;
  };
  'window:getPosition': { request: void; response: { x: number; y: number } };

  // 插件操作
  'plugin:load': { request: { plugin: any }; response: void };
  'plugin:open': { request: { plugin: any }; response: void };
  'plugin:remove': { request: void; response: void };
  'plugin:detach': { request: void; response: void };
  'plugin:openDevTools': { request: void; response: void };
  'plugin:sendKeyDown': {
    request: { keyCode: string; modifiers: string[] };
    response: void;
  };

  // 数据库操作
  'db:put': {
    request: { data: any };
    response: { id: string; ok: boolean; rev: string };
  };
  'db:get': {
    request: { id: string };
    response: any | null;
  };
  'db:remove': {
    request: { doc: any };
    response: { id: string; ok: boolean; rev: string };
  };
  'db:bulkDocs': {
    request: { docs: any[] };
    response: Array<{ id: string; ok: boolean; rev: string }>;
  };
  'db:allDocs': {
    request: { key?: string | string[] };
    response: any[];
  };
  'db:dump': {
    request: { target: string };
    response: any;
  };
  'db:import': {
    request: { target: string };
    response: any;
  };
  'db:postAttachment': {
    request: { docId: string; attachment: any; type: string };
    response: void;
  };
  'db:getAttachment': {
    request: { docId: string };
    response: any;
  };
  'db:getAttachmentType': {
    request: { docId: string };
    response: string | null;
  };

  // 对话框
  'dialog:showOpen': {
    request: Electron.OpenDialogOptions;
    response: string[] | undefined;
  };
  'dialog:showSave': {
    request: Electron.SaveDialogOptions;
    response: string | undefined;
  };

  // 剪贴板
  'clipboard:copyImage': { request: { img: string }; response: boolean };
  'clipboard:copyText': { request: { text: string }; response: boolean };
  'clipboard:copyFile': { request: { file: string | string[] }; response: boolean };
  'clipboard:getFiles': { request: void; response: any[] };

  // 通知
  'notification:show': { request: { body: string }; response: void };

  // 子输入框
  'subInput:set': {
    request: { placeholder?: string };
    response: void;
  };
  'subInput:remove': { request: void; response: void };
  'subInput:setValue': { request: { text: string }; response: void };
  'subInput:readonly': { request: { readonly: boolean }; response: void };
  'subInput:blur': { request: void; response: void };
  'subInput:onChange': { request: { text: string }; response: void };

  // 系统操作
  'system:getPath': {
    request: { name: string };
    response: string;
  };
  'system:shellShowItemInFolder': {
    request: { path: string };
    response: boolean;
  };
  'system:shellBeep': { request: void; response: boolean };
  'system:getFileIcon': {
    request: { path: string };
    response: string;
  };
  'system:simulateKeyboardTap': {
    request: { key: string; modifier?: string[] };
    response: void;
  };
  'system:screenCapture': { request: void; response: void };
  'system:getLocalId': { request: void; response: string };
  'system:isDev': { request: void; response: boolean };
  'system:reRegisterHotKey': { request: void; response: void };

  // 功能管理
  'feature:get': { request: void; response: any[] };
  'feature:set': { request: { feature: any }; response: boolean };
  'feature:remove': { request: { code: any }; response: boolean };

  // 本地启动插件
  'localStart:add': { request: { plugin: any }; response: void };
  'localStart:remove': { request: { plugin: any }; response: void };

  // Detach 窗口操作
  'detach:getConfig': { request: void; response: any };
  'detach:updatePluginSetting': {
    request: { pluginName: string; key: string; value: any };
    response: any;
  };
  'detach:minimize': { request: void; response: void };
  'detach:maximize': { request: void; response: void };
  'detach:close': { request: void; response: void };
  'detach:pin': { request: void; response: void };
  'detach:unpin': { request: void; response: void };
  'detach:endFullScreen': { request: void; response: void };
  'detach:inputChange': { request: { text: string }; response: void };
  'detach:openDevTools': { request: void; response: void };

  // 渲染进程就绪
  'renderer:ready': { request: void; response: { success: boolean } };
}

// ==================== IPC Handler 类型 ====================

/**
 * IPC Handler 函数签名
 */
export type IPCHandler<T extends IPCChannel> = (
  event: Electron.IpcMainInvokeEvent,
  request: IPCChannelMap[T]['request']
) => Promise<IPCChannelMap[T]['response']> | IPCChannelMap[T]['response'];

/**
 * IPC Handler 映射表类型
 */
export type IPCHandlerMap = {
  [K in IPCChannel]: IPCHandler<K>;
};

// ==================== 事件通道定义 ====================

/**
 * 主进程发送给渲染进程的事件通道
 */
export type IPCEventChannel =
  | 'escape-key-pressed'
  | 'ui:setPosition'
  | 'ui:setSubInput'
  | 'ui:removeSubInput'
  | 'ui:setSubInputValue'
  | 'ui:subInputReadonly'
  | 'ui:updatePlugin'
  | 'ui:initRubick'
  | 'state:update';

/**
 * 事件载荷类型映射
 */
export interface IPCEventPayloadMap {
  'escape-key-pressed': void;
  'ui:setPosition': number;
  'ui:setSubInput': { placeholder?: string };
  'ui:removeSubInput': void;
  'ui:setSubInputValue': { value: string };
  'ui:subInputReadonly': boolean;
  'ui:updatePlugin': { currentPlugin: any };
  'ui:initRubick': void;
  'state:update': any;
}

// ==================== 旧版兼容类型 ====================

/**
 * 旧版 msg-trigger 消息格式
 * 保持向后兼容
 */
export interface LegacyIPCMessage {
  type: string;
  data?: any;
  winId?: number;
}

/**
 * 旧版 IPC 方法名映射到新通道
 */
export const LEGACY_TO_NEW_CHANNEL_MAP: Record<string, IPCChannel> = {
  hideWindow: 'window:hide',
  hideMainWindow: 'window:hideMain',
  showMainWindow: 'window:showMain',
  setExpendHeight: 'window:setExpendHeight',
  windowMoving: 'window:moving',

  loadPlugin: 'plugin:load',
  openPlugin: 'plugin:open',
  removePlugin: 'plugin:remove',
  detachPlugin: 'plugin:detach',
  openPluginDevTools: 'plugin:openDevTools',
  sendPluginSomeKeyDownEvent: 'plugin:sendKeyDown',

  dbPut: 'db:put',
  dbGet: 'db:get',
  dbRemove: 'db:remove',
  dbBulkDocs: 'db:bulkDocs',
  dbAllDocs: 'db:allDocs',
  dbDump: 'db:dump',
  dbImport: 'db:import',
  dbPostAttachment: 'db:postAttachment',
  dbGetAttachment: 'db:getAttachment',
  dbGetAttachmentType: 'db:getAttachmentType',

  showOpenDialog: 'dialog:showOpen',
  showSaveDialog: 'dialog:showSave',

  copyImage: 'clipboard:copyImage',
  copyText: 'clipboard:copyText',
  copyFile: 'clipboard:copyFile',
  getCopyFiles: 'clipboard:getFiles',

  showNotification: 'notification:show',

  setSubInput: 'subInput:set',
  removeSubInput: 'subInput:remove',
  setSubInputValue: 'subInput:setValue',
  subInputReadonly: 'subInput:readonly',
  subInputBlur: 'subInput:blur',
  sendSubInputChangeEvent: 'subInput:onChange',

  getPath: 'system:getPath',
  shellShowItemInFolder: 'system:shellShowItemInFolder',
  shellBeep: 'system:shellBeep',
  getFileIcon: 'system:getFileIcon',
  simulateKeyboardTap: 'system:simulateKeyboardTap',
  screenCapture: 'system:screenCapture',
  getLocalId: 'system:getLocalId',
  isDev: 'system:isDev',

  getFeatures: 'feature:get',
  setFeature: 'feature:set',
  removeFeature: 'feature:remove',

  addLocalStartPlugin: 'localStart:add',
  removeLocalStartPlugin: 'localStart:remove',

  rendererReady: 'renderer:ready',
};
