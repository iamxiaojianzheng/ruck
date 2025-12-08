/**
 * 主进程 API 模块
 *
 * 本模块提供了渲染进程与主进程通信的所有 API 接口，是 Ruck 应用的核心通信层。
 * API 类继承自 DBInstance，提供以下功能：
 *
 * **窗口管理**：
 * - 主窗口的显示、隐藏、移动、大小调整
 * - 分离窗口的创建和管理
 *
 * **插件管理**：
 * - 插件的加载、卸载、运行
 * - 插件的分离和附加
 * - 插件开发者工具
 *
 * **数据管理**：
 * - 本地数据库的 CRUD 操作
 * - 数据导入导出
 * - 附件管理
 *
 * **系统集成**：
 * - 剪贴板操作（文本、图片、文件）
 * - 文件对话框
 * - 系统通知
 * - 屏幕截图
 * - 文件图标获取
 * - 键盘模拟
 *
 * **UI 交互**：
 * - 子输入框管理
 * - 功能列表管理
 * - 本地启动插件管理
 *
 * @module API
 */

import { BrowserWindow, ipcMain, dialog, app, Notification, nativeImage, clipboard, screen, shell } from 'electron';
import fs from 'fs';
import ks from 'node-key-sender';
import clipboardFiles from 'clipboard-files';

import { screenCapture } from '@/core';
import commonConst from '@/common/utils/commonConst';
import commonUtil from '@/common/utils/commonUtil';
import getCopyFiles from '@/common/utils/getCopyFiles';
import { DECODE_KEY, PLUGIN_INSTALL_DIR as baseDir } from '@/common/constants/main';

import mainInstance from '../index';
import runnerInstance from '../browsers/runner-instance';
import { detach } from '../browsers';
import DBInstance from './db';
import getWinPosition from './getWinPosition';
import { registerSeparateShortcut, unregisterSeparateShortcut } from './registerHotKey';
import { setCurrentPlugin as setPluginHandlerCurrentPlugin } from '../ipc/handlers/plugin-handlers';
import { mainLogger as logger } from '@/common/logger';
// import { copyFilesToWindowsClipboard } from './windowsClipboard';

/**
 *  sanitize input files 剪贴板文件合法性校验
 * @param input
 * @returns
 */
const sanitizeInputFiles = (input: unknown): string[] => {
  const candidates = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
  return candidates
    .map((filePath) => (typeof filePath === 'string' ? filePath.trim() : ''))
    .filter((filePath) => {
      if (!filePath) return false;
      try {
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    });
};

const detachInstance = detach();

/**
 * 主进程 API 类
 *
 * 继承自 DBInstance，提供所有渲染进程需要调用的主进程方法。
 * 通过 IPC 通信接收渲染进程的请求，并执行相应的操作。
 */
class API extends DBInstance {
  /**
   * 初始化 API，注册所有 IPC 监听器
   *
   * 本方法在主窗口创建后立即调用，负责：
   * 1. 注册 'msg-trigger' IPC 事件监听器（保持向后兼容）
   * 2. 设置主窗口的 show/hide 事件监听
   * 3. 注册 ESC 键监听器
   *
   * @param mainWindow 主窗口实例
   */
  init(mainWindow: BrowserWindow) {
    // 响应 preload.js 事件（保持向后兼容）
    ipcMain.on('msg-trigger', async (event, arg) => {
      const window = arg.winId ? BrowserWindow.fromId(arg.winId) : mainWindow;
      try {
        // 类型安全的方法调用映射
        const methodMap: Record<string, (arg: any, window: BrowserWindow, event: any) => any> = {
          // 窗口操作
          hideWindow: () => this.hideWindow(),
          hideMainWindow: () => this.hideMainWindow(arg, window),
          showMainWindow: () => this.showMainWindow(arg, window),
          setExpendHeight: () => this.setExpendHeight(arg, window, event),
          windowMoving: () => this.windowMoving(arg, window, event),

          // 插件操作
          loadPlugin: () => this.loadPlugin(arg, window),
          openPlugin: () => this.openPlugin(arg, window),
          removePlugin: () => this.removePlugin(event, window),
          detachPlugin: () => this.detachPlugin(event, window),
          openPluginDevTools: () => this.openPluginDevTools(),

          // 数据库操作
          dbPut: () => this.dbPut(arg),
          dbGet: () => this.dbGet(arg),
          dbRemove: () => this.dbRemove(arg),
          dbBulkDocs: () => this.dbBulkDocs(arg),
          dbAllDocs: () => this.dbAllDocs(arg),
          dbDump: () => this.dbDump(arg),
          dbImport: () => this.dbImport(arg),
          dbPostAttachment: () => this.dbPostAttachment(arg),
          dbGetAttachment: () => this.dbGetAttachment(arg),
          dbGetAttachmentType: () => this.dbGetAttachmentType(arg),

          // 对话框
          showOpenDialog: () => this.showOpenDialog(arg, window),
          showSaveDialog: () => this.showSaveDialog(arg, window),

          // 剪贴板
          copyImage: () => this.copyImage(arg),
          copyText: () => this.copyText(arg),
          copyFile: () => this.copyFile(arg),
          getCopyFiles: () => this.getCopyFiles(),

          // 通知
          showNotification: () => this.showNotification(arg),

          // 子输入框
          setSubInput: () => this.setSubInput(arg, window, event),
          removeSubInput: () => this.removeSubInput(arg, window, event),
          setSubInputValue: () => this.setSubInputValue(arg, window, event),
          subInputReadonly: () => this.subInputReadonly(arg, window, event),
          subInputBlur: () => this.subInputBlur(),
          sendSubInputChangeEvent: () => this.sendSubInputChangeEvent(arg),

          // 系统操作
          getPath: () => this.getPath(arg),
          shellShowItemInFolder: () => this.shellShowItemInFolder(arg),
          shellBeep: () => this.shellBeep(),
          getFileIcon: () => this.getFileIcon(arg),
          simulateKeyboardTap: () => this.simulateKeyboardTap(arg),
          screenCapture: () => this.screenCapture(arg, window),
          getLocalId: () => this.getLocalId(),
          isDev: () => this.isDev(),

          // 功能管理
          getFeatures: () => this.getFeatures(),
          setFeature: () => this.setFeature(arg, window),
          removeFeature: () => this.removeFeature(arg, window),

          // 本地启动插件
          addLocalStartPlugin: () => this.addLocalStartPlugin(arg, window),
          removeLocalStartPlugin: () => this.removeLocalStartPlugin(arg, window),

          // 渲染进程就绪
          rendererReady: () => this.rendererReady(),
        };

        const handler = methodMap[arg.type];
        if (handler) {
          const data = await handler(arg, window, event);
          event.returnValue = data;
        } else {
          console.warn(`Unknown IPC message type: ${arg.type}`);
          logger.warn('未知的 IPC 消息类型', { type: arg.type });
          event.returnValue = null;
        }
      } catch (error) {
        console.error(`Error handling IPC message "${arg.type}":`, error);
        logger.error('IPC 消息处理错误', {
          type: arg.type,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        event.returnValue = null;
      }
    });

    // 按 ESC 退出插件
    mainWindow.webContents.on('before-input-event', (event, input) => this.__EscapeKeyDown(event, input, mainWindow));
    // 设置主窗口的 show/hide 事件监听
    this.setupMainWindowHooks(mainWindow);
  }

  private setupMainWindowHooks(mainWindow: BrowserWindow) {
    mainWindow.on('show', () => {
      // 触发插件的 onShow hook
      runnerInstance.executeHooks('Show', null);
    });

    mainWindow.on('hide', () => {
      // 触发插件的 onHide hook
      runnerInstance.executeHooks('Hide', null);
    });

    mainWindow.on('user-resize-attempt' as any, () => {
      this.detachPlugin(null, mainWindow);
    });
  }

  public isDev = (): boolean => {
    return commonConst.dev();
  };

  public getCurrentWindow = (window: BrowserWindow, e: Electron.IpcMainEvent) => {
    let originWindow = BrowserWindow.fromWebContents(e.sender);
    if (originWindow !== window) originWindow = detachInstance.getWindow();
    return originWindow;
  };

  public __EscapeKeyDown = (event: Electron.Event, input: Electron.Input, window: BrowserWindow) => {
    if (input.type !== 'keyDown') return;
    if (!(input.meta || input.control || input.shift || input.alt)) {
      if (input.key === 'Escape') {
        event.preventDefault(); // 阻止ESC的默认行为，避免竞态条件
        if (this.currentPlugin) {
          // 有插件运行时，退出插件
          this.removePlugin(null, window);
        } else {
          // 没有插件运行时，通知渲染进程处理 ESC 键
          // 渲染进程会根据输入框内容决定清空还是隐藏窗口
          window.webContents.send('escape-key-pressed');
        }
      }

      return;
    }
  };

  public windowMoving(
    {
      data: { mouseX, mouseY, width, height },
    }: { data: { mouseX: number; mouseY: number; width: number; height: number } },
    window: BrowserWindow,
    e: Electron.IpcMainEvent
  ) {
    const { x, y } = screen.getCursorScreenPoint();
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.setBounds({ x: x - mouseX, y: y - mouseY, width, height });
    getWinPosition.setPosition(x - mouseX, y - mouseY);
  }

  /**
   * 加载并打开插件
   *
   * 先通知渲染进程加载插件，然后调用 openPlugin 打开插件。
   *
   * @param data 插件信息对象
   * @param window 窗口实例
   */
  public loadPlugin({ data: plugin }: { data: any }, window: BrowserWindow) {
    window.webContents.executeJavaScript(`window.loadPlugin(${JSON.stringify(plugin)})`);
    this.openPlugin({ data: plugin }, window);
  }

  /**
   * 打开插件
   *
   * 本方法是插件系统的核心方法，负责：
   * 1. 检查插件平台兼容性
   * 2. 准备窗口大小和状态
   * 3. 初始化插件运行器
   * 4. 设置当前插件
   * 5. 注册分离窗口快捷键
   *
   * @param data 插件信息对象
   * @param window 窗口实例
   */
  public openPlugin({ data: plugin }: { data: any }, window: BrowserWindow) {
    if (plugin.platform && !plugin.platform.includes(process.platform)) {
      return new Notification({
        title: `插件不支持当前 ${process.platform} 系统`,
        body: `插件仅支持 ${plugin.platform.join(',')}`,
        icon: plugin.logo,
      }).show();
    }

    window.setSize(window.getSize()[0], 60);
    this.removePlugin(null, window);

    // 模板文件
    if (!plugin.main) {
      plugin.tplPath = commonUtil.getTplIndex();
    }

    if (plugin.name === 'rubick-system-feature') {
      plugin.logo = plugin.logo || `file://${__static}/logo.png`;
      plugin.indexPath = commonUtil.getFeatureIndex();
    } else if (!plugin.indexPath) {
      plugin.indexPath = commonUtil.getPluginIndex(plugin, null);
    }

    runnerInstance.init(plugin, window);
    this.currentPlugin = plugin;
    setPluginHandlerCurrentPlugin(plugin); // 同步到 plugin-handlers
    window.webContents.executeJavaScript(
      `window.setCurrentPlugin(${JSON.stringify({ currentPlugin: this.currentPlugin })})`
    );

    window.show();

    const view = runnerInstance.getView();
    if (!view.inited) {
      view?.webContents?.on('before-input-event', (event, input) => this.__EscapeKeyDown(event, input, window));
    }

    // 插件打开后，注册分离窗口快捷键
    registerSeparateShortcut();
  }

  /**
   * 移除插件
   *
   * 关闭当前打开的插件，清理插件视图和状态，取消注册分离窗口快捷键。
   *
   * @param e IPC 事件对象
   * @param window 窗口实例
   */
  public removePlugin(e: any, window: BrowserWindow) {
    runnerInstance.removeView(window);
    this.currentPlugin = null;
    setPluginHandlerCurrentPlugin(null); // 同步到 plugin-handlers

    // 插件关闭后，取消注册分离窗口快捷键
    unregisterSeparateShortcut();
  }

  /**
   * 渲染进程初始化完成通知
   */
  public rendererReady() {
    mainInstance.setRendererReady(true);
    return { success: true };
  }

  /**
   * 隐藏主窗口
   */
  public hideWindow() {
    mainInstance.windowCreator.getWindow().hide();
  }

  public openPluginDevTools() {
    runnerInstance.getView().webContents.openDevTools({ mode: 'detach' });
  }

  public hideMainWindow(arg: any, window: BrowserWindow) {
    window.hide();
  }

  public showMainWindow(arg: any, window: BrowserWindow) {
    window.show();
  }

  public showOpenDialog({ data }: { data: Electron.OpenDialogOptions }, window: BrowserWindow) {
    return dialog.showOpenDialogSync(window, data);
  }

  public showSaveDialog({ data }: { data: Electron.SaveDialogOptions }, window: BrowserWindow) {
    return dialog.showSaveDialogSync(window, data);
  }

  public setExpendHeight({ data: height }, window: BrowserWindow, e: Electron.IpcMainEvent) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    const targetHeight = height;
    const currentSize = originWindow.getSize();

    // 使用允许调整的方法
    if ((originWindow as any).setExpendHeightAllowed) {
      (originWindow as any).setExpendHeightAllowed(targetHeight);
    } else {
      // 回退方案
      originWindow.setSize(currentSize[0], targetHeight);
    }

    const screenPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(screenPoint);
    const position = originWindow.getPosition()[1] + targetHeight > display.bounds.height ? height - 60 : 0;
    originWindow.webContents.executeJavaScript(
      `window.setPosition && typeof window.setPosition === "function" && window.setPosition(${position})`
    );
  }

  public setSubInput({ data }, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(
      `window.setSubInput(${JSON.stringify({
        placeholder: data.placeholder,
      })})`
    );
  }

  public subInputBlur() {
    runnerInstance.getView().webContents.focus();
  }

  public sendSubInputChangeEvent({ data }) {
    runnerInstance.executeHooks('SubInputChange', data);
  }

  public removeSubInput(data, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(`window.removeSubInput()`);
  }

  public subInputReadonly({ data }, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(`window.subInputReadonly(${data})`);
  }

  public setSubInputValue({ data }, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(
      `window.setSubInputValue(${JSON.stringify({
        value: data.text,
      })})`
    );
    this.sendSubInputChangeEvent({ data });
  }

  public getPath({ data }) {
    return app.getPath(data.name);
  }

  public showNotification({ data: { body } }) {
    if (!Notification.isSupported()) return;
    'string' != typeof body && (body = String(body));
    const plugin = this.currentPlugin;
    const notify = new Notification({
      title: plugin ? plugin.pluginName : null,
      body,
      icon: plugin ? plugin.logo : null,
    });
    notify.show();
  }

  public copyImage = ({ data }) => {
    const image = nativeImage.createFromDataURL(data.img);
    clipboard.writeImage(image);
  };

  public copyText({ data }) {
    clipboard.writeText(String(data.text));
    return true;
  }

  public copyFile({ data }) {
    const targetFiles = sanitizeInputFiles(data?.file);

    if (!targetFiles.length) {
      return false;
    }

    clipboardFiles.writeFiles(targetFiles);
    return false;
  }

  public getFeatures() {
    return this.currentPlugin?.features;
  }

  public setFeature({ data }, window) {
    this.currentPlugin = {
      ...this.currentPlugin,
      features: (() => {
        let has = false;
        this.currentPlugin.features.some((feature) => {
          has = feature.code === data.feature.code;
          return has;
        });
        if (!has) {
          return [...this.currentPlugin.features, data.feature];
        }
        return this.currentPlugin.features;
      })(),
    };
    window.webContents.executeJavaScript(
      `window.updatePlugin(${JSON.stringify({
        currentPlugin: this.currentPlugin,
      })})`
    );
    return true;
  }

  public removeFeature({ data }, window) {
    this.currentPlugin = {
      ...this.currentPlugin,
      features: this.currentPlugin.features.filter((feature) => {
        if (data.code.type) {
          return feature.code.type !== data.code.type;
        }
        return feature.code !== data.code;
      }),
    };
    window.webContents.executeJavaScript(
      `window.updatePlugin(${JSON.stringify({
        currentPlugin: this.currentPlugin,
      })})`
    );
    return true;
  }

  public sendPluginSomeKeyDownEvent({ data: { modifiers, keyCode } }) {
    const code = DECODE_KEY[keyCode];
    const view = runnerInstance.getView();
    if (!code || !view) return;
    if (modifiers.length > 0) {
      view?.webContents?.sendInputEvent({
        type: 'keyDown',
        modifiers,
        keyCode: code,
      });
    } else {
      view?.webContents?.sendInputEvent({
        type: 'keyDown',
        keyCode: code,
      });
    }
  }

  /**
   * 分离插件
   *
   * 将当前插件从主窗口分离到独立窗口，允许用户：
   * - 自由移动插件窗口
   * - 调整插件窗口大小
   * - 保持插件持续运行
   *
   * @param e IPC 事件对象
   * @param window 窗口实例
   */
  public detachPlugin(e, window: BrowserWindow) {
    if (!this.currentPlugin) return;
    window.setBrowserView(null);
    window.webContents.executeJavaScript(`window.getMainInputInfo()`).then((res) => {
      const pluginInfo = { ...this.currentPlugin, subInput: res };
      detachInstance.init(pluginInfo, window, runnerInstance);
      window.webContents.executeJavaScript(`window.initRubick()`);
      window.setSize(window.getSize()[0], 60);
      this.currentPlugin = null;
      setPluginHandlerCurrentPlugin(null); // 同步到 plugin-handlers

      // 插件分离后，主窗口已无插件，取消注册分离窗口快捷键
      unregisterSeparateShortcut();
    });
  }

  public detachInputChange({ data }) {
    this.sendSubInputChangeEvent({ data });
  }

  public getLocalId() {
    return encodeURIComponent(app.getPath('home'));
  }

  public shellShowItemInFolder({ data }) {
    shell.showItemInFolder(data.path);
    return true;
  }

  public async getFileIcon({ data }) {
    const nativeImage = await app.getFileIcon(data.path, { size: 'normal' });
    return nativeImage.toDataURL();
  }

  public shellBeep() {
    shell.beep();
    return true;
  }

  public screenCapture(arg, window) {
    screenCapture(window, (img) => {
      runnerInstance.executeHooks('ScreenCapture', {
        data: img,
      });
    });
  }

  public getCopyFiles() {
    return getCopyFiles();
  }

  public simulateKeyboardTap({ data: { key, modifier } }) {
    let keys = [key.toLowerCase()];
    if (modifier && Array.isArray(modifier) && modifier.length > 0) {
      keys = modifier.concat(keys);
      ks.sendCombination(keys);
    } else {
      ks.sendKeys(keys);
    }
  }

  public addLocalStartPlugin({ data: { plugin } }, window) {
    window.webContents.executeJavaScript(
      `window.addLocalStartPlugin(${JSON.stringify({
        plugin,
      })})`
    );
  }

  public removeLocalStartPlugin({ data: { plugin } }, window) {
    window.webContents.executeJavaScript(
      `window.removeLocalStartPlugin(${JSON.stringify({
        plugin,
      })})`
    );
  }
}

export default new API();
