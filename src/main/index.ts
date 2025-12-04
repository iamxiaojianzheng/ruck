'use strict';
import electron, { app, globalShortcut, protocol, BrowserWindow } from 'electron';
import { main, guide } from './browsers';
import commonConst from '../common/utils/commonConst';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import API from './common/api';
import createTray from './common/tray';
import registerHotKey from './common/registerHotKey';
import localConfig from './common/initLocalConfig';
import { getSearchFiles, putFileToRubick, macBeforeOpen } from './common/getSearchFiles';

import '../common/utils/localPlugin';

import checkVersion from './common/versionHandler';
import registerSystemPlugin from './common/registerSystemPlugin';

/**
 * 应用主类
 * 负责管理应用生命周期、窗口创建、托盘、快捷键等
 */
class App {
  // 窗口创建器
  public windowCreator: { init: () => void; getWindow: () => BrowserWindow };
  // 系统插件管理器
  private systemPlugins: any;

  constructor() {
    // 注册自定义协议
    protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

    // 初始化主窗口创建器
    this.windowCreator = main();

    // 检查单实例锁
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    } else {
      // 注册系统插件
      this.systemPlugins = registerSystemPlugin();

      // 绑定生命周期事件
      this.beforeReady();
      this.onReady();
      this.onRunning();
      this.onQuit();
    }
  }

  /**
   * 应用准备就绪前的初始化
   */
  beforeReady() {
    // macOS 特定处理
    if (commonConst.macOS()) {
      macBeforeOpen();
      if (commonConst.production() && !app.isInApplicationsFolder()) {
        app.moveToApplicationsFolder();
      } else {
        app.dock.hide();
      }
    } else {
      // 禁用硬件加速（非 macOS）
      app.disableHardwareAcceleration();
    }
  }

  /**
   * 创建主窗口
   */
  createWindow() {
    this.windowCreator.init();
  }

  /**
   * 应用准备就绪时的处理
   */
  onReady() {
    const readyFunction = async () => {
      // 检查版本更新
      checkVersion();

      // 初始化本地配置
      await localConfig.init();
      const config = await localConfig.getConfig();
      const { common, shortCut } = config?.perf || {};

      // 首次运行显示引导页
      if (!common.guide) {
        guide().init();
        common.guide = true;
        localConfig.setConfig(config);
      }

      // 创建主窗口
      this.createWindow();
      const mainWindow = this.windowCreator.getWindow();

      // 初始化 API
      API.init(mainWindow);

      // 创建系统托盘
      const appTray = createTray(this.windowCreator.getWindow());
      appTray.then((tray) => {
        const showAndHidden = shortCut?.showAndHidden;
        const tooltip = `${common.appName || 'Ruck'}(${showAndHidden})`;
        if (tooltip) {
          tray.setToolTip(tooltip);
        }
      });

      // 注册全局快捷键
      registerHotKey(this.windowCreator.getWindow());

      // 触发系统插件的 ready 钩子
      this.systemPlugins.triggerReadyHooks(
        Object.assign(electron, {
          mainWindow: this.windowCreator.getWindow(),
          API,
        })
      );
    };

    if (!app.isReady()) {
      app.on('ready', readyFunction);
    } else {
      readyFunction();
    }
  }

  /**
   * 应用运行时的事件监听
   */
  onRunning() {
    // 监听第二个实例启动
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      const files = getSearchFiles(commandLine, workingDirectory);
      const win = this.windowCreator.getWindow();

      if (win) {
        if (win.isMinimized()) {
          win.restore();
        }
        win.focus();

        // 如果有文件参数，则处理文件
        if (files.length > 0) {
          win.show();
          putFileToRubick(win.webContents, files);
        }
      }
    });

    // 激活应用时（macOS 点击 dock 图标）
    app.on('activate', () => {
      if (!this.windowCreator.getWindow()) {
        this.createWindow();
      }
    });

    if (commonConst.windows()) {
      // app.setAppUserModelId(pkg.build.appId)
    }
  }

  /**
   * 应用退出时的处理
   */
  onQuit() {
    // 所有窗口关闭时
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      } else {
        // macOS 注销所有快捷键
        globalShortcut.unregisterAll();
      }
    });

    // 即将退出时
    app.on('will-quit', () => {
      // 注销所有快捷键
      globalShortcut.unregisterAll();
    });

    // 开发环境下的优雅退出处理
    if (commonConst.dev()) {
      if (process.platform === 'win32') {
        process.on('message', (data) => {
          if (data === 'graceful-exit') {
            app.quit();
          }
        });
      } else {
        process.on('SIGTERM', () => {
          app.quit();
        });
      }
    }
  }
}

export default new App();
