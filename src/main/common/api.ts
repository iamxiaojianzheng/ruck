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
import { runner, detach } from '../browsers';
import DBInstance from './db';
import getWinPosition from './getWinPosition';
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

const runnerInstance = runner();
const detachInstance = detach();

class API extends DBInstance {
  init(mainWindow: BrowserWindow) {
    // 响应 preload.js 事件
    ipcMain.on('msg-trigger', async (event, arg) => {
      const window = arg.winId ? BrowserWindow.fromId(arg.winId) : mainWindow;
      const data = await this[arg.type](arg, window, event);
      event.returnValue = data;
      // event.sender.send(`msg-back-${arg.type}`, data);
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

  public loadPlugin({ data: plugin }: { data: any }, window: BrowserWindow) {
    window.webContents.executeJavaScript(`window.loadPlugin(${JSON.stringify(plugin)})`);
    this.openPlugin({ data: plugin }, window);
  }

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
    window.webContents.executeJavaScript(
      `window.setCurrentPlugin(${JSON.stringify({ currentPlugin: this.currentPlugin })})`
    );

    window.show();

    const view = runnerInstance.getView();
    if (!view.inited) {
      view?.webContents?.on('before-input-event', (event, input) => this.__EscapeKeyDown(event, input, window));
    }
  }

  public removePlugin(e: any, window: BrowserWindow) {
    runnerInstance.removeView(window);
    this.currentPlugin = null;
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

  public detachPlugin(e, window: BrowserWindow) {
    if (!this.currentPlugin) return;
    window.setBrowserView(null);
    // console.log(window.contentView.children);
    // const view = window.contentView.children[0];
    // window.contentView.removeChildView(view);
    window.webContents.executeJavaScript(`window.getMainInputInfo()`).then((res) => {
      const pluginInfo = { ...this.currentPlugin, subInput: res };
      detachInstance.init(pluginInfo, window, runnerInstance);
      window.webContents.executeJavaScript(`window.initRubick()`);
      window.setSize(window.getSize()[0], 60);
      this.currentPlugin = null;
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
