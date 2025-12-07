/**
 * IPC 处理器注册模块
 * 统一注册所有 IPC 处理器
 */

import { ipcRegistry } from './index';

// 导入所有处理器
import * as windowHandlers from './handlers/window-handlers';
import * as dbHandlers from './handlers/db-handlers';
import * as clipboardHandlers from './handlers/clipboard-handlers';
import * as pluginHandlers from './handlers/plugin-handlers';
import * as systemHandlers from './handlers/system-handlers';
import * as otherHandlers from './handlers/other-handlers';

/**
 * 注册所有 IPC 处理器
 */
export function registerAllHandlers(): void {
    // 窗口操作
    ipcRegistry.register('window:hide', windowHandlers.hideWindow);
    ipcRegistry.register('window:show', windowHandlers.showWindow);
    ipcRegistry.register('window:hideMain', windowHandlers.hideMainWindow);
    ipcRegistry.register('window:showMain', windowHandlers.showMainWindow);
    ipcRegistry.register('window:setExpendHeight', windowHandlers.setExpendHeight);
    ipcRegistry.register('window:moving', windowHandlers.windowMoving);
    ipcRegistry.register('window:getPosition', windowHandlers.getWindowPosition);

    // 插件操作
    ipcRegistry.register('plugin:load', pluginHandlers.loadPlugin);
    ipcRegistry.register('plugin:open', pluginHandlers.openPlugin);
    ipcRegistry.register('plugin:remove', pluginHandlers.removePlugin);
    ipcRegistry.register('plugin:detach', pluginHandlers.detachPlugin);
    ipcRegistry.register('plugin:openDevTools', pluginHandlers.openPluginDevTools);

    // 数据库操作
    ipcRegistry.register('db:put', dbHandlers.dbPut);
    ipcRegistry.register('db:get', dbHandlers.dbGet);
    ipcRegistry.register('db:remove', dbHandlers.dbRemove);
    ipcRegistry.register('db:bulkDocs', dbHandlers.dbBulkDocs);
    ipcRegistry.register('db:allDocs', dbHandlers.dbAllDocs);
    ipcRegistry.register('db:dump', dbHandlers.dbDump);
    ipcRegistry.register('db:import', dbHandlers.dbImport);
    ipcRegistry.register('db:postAttachment', dbHandlers.dbPostAttachment);
    ipcRegistry.register('db:getAttachment', dbHandlers.dbGetAttachment);
    ipcRegistry.register('db:getAttachmentType', dbHandlers.dbGetAttachmentType);

    // 剪贴板操作
    ipcRegistry.register('clipboard:copyImage', clipboardHandlers.copyImage);
    ipcRegistry.register('clipboard:copyText', clipboardHandlers.copyText);
    ipcRegistry.register('clipboard:copyFile', clipboardHandlers.copyFile);
    ipcRegistry.register('clipboard:getFiles', clipboardHandlers.getClipboardFiles);

    // 系统操作
    ipcRegistry.register('system:getPath', systemHandlers.getPath);
    ipcRegistry.register('system:shellShowItemInFolder', systemHandlers.shellShowItemInFolder);
    ipcRegistry.register('system:shellBeep', systemHandlers.shellBeep);
    ipcRegistry.register('system:getFileIcon', systemHandlers.getFileIcon);
    ipcRegistry.register('system:simulateKeyboardTap', systemHandlers.simulateKeyboardTap);
    ipcRegistry.register('system:screenCapture', systemHandlers.handleScreenCapture);
    ipcRegistry.register('system:getLocalId', systemHandlers.getLocalId);
    ipcRegistry.register('system:isDev', systemHandlers.isDev);
    ipcRegistry.register('system:reRegisterHotKey', systemHandlers.reRegisterHotKey);

    // 通知
    ipcRegistry.register('notification:show', systemHandlers.showNotification);

    // 对话框
    ipcRegistry.register('dialog:showOpen', otherHandlers.showOpenDialog);
    ipcRegistry.register('dialog:showSave', otherHandlers.showSaveDialog);

    // 功能管理
    ipcRegistry.register('feature:get', otherHandlers.getFeatures);
    ipcRegistry.register('feature:set', otherHandlers.setFeature);
    ipcRegistry.register('feature:remove', otherHandlers.removeFeature);

    // 子输入框
    ipcRegistry.register('subInput:set', otherHandlers.setSubInput);
    ipcRegistry.register('subInput:remove', otherHandlers.removeSubInput);
    ipcRegistry.register('subInput:setValue', otherHandlers.setSubInputValue);
    ipcRegistry.register('subInput:readonly', otherHandlers.subInputReadonly);
    ipcRegistry.register('subInput:blur', otherHandlers.subInputBlur);
    ipcRegistry.register('subInput:onChange', otherHandlers.subInputOnChange);

    // 本地启动插件
    ipcRegistry.register('localStart:add', otherHandlers.addLocalStartPlugin);
    ipcRegistry.register('localStart:remove', otherHandlers.removeLocalStartPlugin);

    // 渲染进程就绪
    ipcRegistry.register('renderer:ready', otherHandlers.rendererReady);

    // 标记为已初始化
    ipcRegistry.markInitialized();

    console.log(
        `[IPC] 已注册 ${ipcRegistry.getRegisteredChannels().length} 个 IPC 处理器`
    );
}

/**
 * 导出 getCurrentPlugin 供其他模块使用
 */
export { getCurrentPlugin, setCurrentPlugin } from './handlers/plugin-handlers';
