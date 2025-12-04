import { app, net, BrowserWindow, protocol, nativeTheme } from 'electron';
import path from 'path';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
// import versonHandler from '../common/versionHandler';
import { uIOhook } from 'uiohook-napi';
import * as remote from '@electron/remote/main';

import localConfig from '@/main/common/initLocalConfig';
import commonConst from '../../common/utils/commonConst';
import { APP_NAME, WINDOW_CONFIG } from '@/common/constants';
import type { MainWindowInstance } from '@/types';
// eslint-disable-next-line @typescript-eslint/no-var-requires
remote.initialize();

export default () => {
  let win: MainWindowInstance;
  let isBlur = false;

  const init = () => {
    createWindow();
    if (win) {
      remote.enable(win.webContents);
    }
  };

  const createWindow = async () => {
    win = new BrowserWindow({
      height: WINDOW_CONFIG.HEIGHT,
      minHeight: WINDOW_CONFIG.MIN_HEIGHT,
      maxHeight: WINDOW_CONFIG.MAX_HEIGHT,
      useContentSize: true,
      resizable: true, // 允许调整，但通过 will-resize 事件阻止用户手动拖拽
      width: WINDOW_CONFIG.WIDTH,
      minWidth: WINDOW_CONFIG.WIDTH,
      maxWidth: WINDOW_CONFIG.WIDTH, // 锁定宽度
      frame: false,
      title: APP_NAME,
      show: false,
      skipTaskbar: true,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c28' : '#fff',
      webPreferences: {
        webSecurity: false,
        backgroundThrottling: false,
        contextIsolation: false,
        devTools: commonConst.dev(),
        webviewTag: true,
        nodeIntegration: true,
        preload: path.join(__static, 'preload.js'),
        spellcheck: false,
        sandbox: false,
      },
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    } else {
      createProtocol('app');
      // Load the index.html when not in development
      win.loadURL('app://./index.html');
    }

    protocol.handle('image', (req) => {
      return net.fetch(req);
    });

    win.on('closed', () => {
      win = undefined;
    });

    // 阻止用户手动拖拽调整窗口大小，但允许代码调整
    let allowResize = false;
    win.on('will-resize', (event, newBounds) => {
      if (!allowResize) {
        // 阻止手动拖拽调整
        event.preventDefault();
      }
    });

    // 暴露方法供代码调用时允许调整
    (win as any).setExpendHeightAllowed = (height: number) => {
      allowResize = true;
      win.setSize(win.getSize()[0], height);
      // 使用 nextTick 确保 setSize 完成后再禁止
      process.nextTick(() => {
        allowResize = false;
      });
    };

    win.on('show', () => {
      isBlur = false;
      // 触发主窗口的 onShow hook
      win.webContents.executeJavaScript(
        `window.rubick && window.rubick.hooks && typeof window.rubick.hooks.onShow === "function" && window.rubick.hooks.onShow()`
      );
      // versonHandler.checkUpdate();
      // win.webContents.openDevTools();
    });

    win.on('hide', () => {
      // 触发主窗口的 onHide hook
      win.webContents.executeJavaScript(
        `window.rubick && window.rubick.hooks && typeof window.rubick.hooks.onHide === "function" && window.rubick.hooks.onHide()`
      );
    });

    // 判断失焦是否隐藏
    win.on('blur', async () => {
      // console.log('blur');
      isBlur = true;
    });

    uIOhook.on('mousedown', (event) => {
      // console.log('main hook mousedown');
    });

    // 监听鼠标抬起事件
    uIOhook.on('mouseup', async (event) => {
      // console.log('main hook mouseup');
      const config = await localConfig.getConfig();
      if (isBlur && config.perf.common.hideOnBlur && win.isVisible() && !BrowserWindow.getFocusedWindow()) {
        console.log('main mouseup hide');
        win.hide();
      }
    });
  };

  const getWindow = () => win;

  return {
    init,
    getWindow,
  };
};
