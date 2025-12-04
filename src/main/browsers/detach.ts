import { BrowserWindow, ipcMain, nativeTheme, screen } from 'electron';
import localConfig from '../common/initLocalConfig';
import commonConst from '@/common/utils/commonConst';
import path from 'path';
import fs from 'fs';
import { WINDOW_CONFIG } from '@/common/constants';
import { PLUGIN_INSTALL_ROOT_DIR } from '@/common/constants/main';

export default () => {
  const DETACH_CHANNEL = 'detach:service';
  let win: Electron.BrowserWindow;
  let view: any;

  let rb: RunnerBrowser;
  let appWindow: BrowserWindow;

  const init = async (pluginInfo, appWindowRef: BrowserWindow, runnerBrowserRef: RunnerBrowser) => {
    rb = runnerBrowserRef;
    appWindow = appWindowRef;

    view = rb.getView();
    const bounds = appWindow.getBounds();
    const win = await createWindow(pluginInfo, bounds);

    const logoPath =
      pluginInfo.logoPath ||
      path.join(PLUGIN_INSTALL_ROOT_DIR, pluginInfo.originName, 'logo' + path.extname(pluginInfo.logo));

    if (fs.existsSync(logoPath)) {
      win.setIcon(logoPath);
    } else {
      win.setIcon(path.join(__static, 'logo.png'));
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@electron/remote/main').enable(win.webContents);
  };

  const createWindow = async (pluginInfo, bounds: Electron.Rectangle) => {
    win = new BrowserWindow({
      ...bounds,
      minHeight: WINDOW_CONFIG.MIN_HEIGHT,
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 12, y: 21 },
      title: pluginInfo.pluginName,
      resizable: true,
      frame: true,
      show: false,
      enableLargerThanScreen: true,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c28' : '#fff',
      webPreferences: {
        webSecurity: false,
        backgroundThrottling: false,
        contextIsolation: false,
        webviewTag: true,
        devTools: commonConst.dev(),
        nodeIntegration: true,
        navigateOnDragDrop: true,
        spellcheck: false,
      },
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      win.loadURL('http://localhost:8082');
    } else {
      win.loadURL(`file://${path.join(__static, './detach/index.html')}`);
    }

    win.on('close', () => {
      console.log('detach window close');
      executeHooks('PluginOut', null);
    });

    win.on('closed', () => {
      console.log('detach window closed');
      rb.removeView(appWindow);
      ipcMain.removeAllListeners(DETACH_CHANNEL);
      win = null;
    });

    win.on('focus', () => {
      view && win?.webContents?.focus();
    });

    win.once('ready-to-show', async () => {
      const config = await localConfig.getConfig();
      const darkMode = config.perf.common.darkMode;
      if (darkMode) {
        win.webContents.executeJavaScript(`document.body.classList.add("dark");window.rubick.theme="dark"`);
      }

      view.setAutoResize({ width: true, height: true });
      win.setBrowserView(view);
      view.inDetach = true;
      win.webContents.executeJavaScript(`window.initDetach(${JSON.stringify(pluginInfo)})`);

      // const id = win.webContents.id;
      ipcMain.on(DETACH_CHANNEL, async (event, arg: { type: string }) => {
        console.log('detach channel', win.webContents.id, arg);
        const data = await operation[arg.type]();
        event.returnValue = data;
      });

      win.show();
    });

    // 最大化设置
    win.on('maximize', () => {
      win.webContents.executeJavaScript('window.maximizeTrigger()');
      const view = win.getBrowserView();
      if (!view) return;
      // const display = screen.getDisplayMatching(win.getBounds());
      const bounds = win.getBounds();
      console.log('detach window maximize', bounds);
      // view.setBounds({
      //   x: 0,
      //   y: WINDOW_MIN_HEIGHT,
      //   width: display.workArea.width,
      //   height: display.workArea.height - WINDOW_MIN_HEIGHT,
      // });
    });

    // 解除最大化，返回之前的状态
    win.on('unmaximize', () => {
      win.webContents.executeJavaScript('window.unmaximizeTrigger()');
      const view = win.getBrowserView();
      if (!view) return;
      const bounds = win.getBounds();
      console.log('detach window unmaximize', bounds);
      // const display = screen.getDisplayMatching(bounds);
      // const width = (display.scaleFactor * bounds.width) % 1 == 0 ? bounds.width : bounds.width - 2;
      // const height = (display.scaleFactor * bounds.height) % 1 == 0 ? bounds.height : bounds.height - 2;
      // view.setBounds({
      //   x: 0,
      //   y: WINDOW_MIN_HEIGHT,
      //   width,
      //   height: height - WINDOW_MIN_HEIGHT,
      // });
    });

    win.on('page-title-updated', (e) => {
      e.preventDefault();
    });

    win.webContents.once('render-process-gone', () => {
      win.close();
    });

    if (commonConst.macOS()) {
      win.on('enter-full-screen', () => {
        win.webContents.executeJavaScript('window.enterFullScreenTrigger()');
      });
      win.on('leave-full-screen', () => {
        win.webContents.executeJavaScript('window.leaveFullScreenTrigger()');
      });
    }

    view.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      if (!(input.meta || input.control || input.shift || input.alt)) {
        if (input.key === 'Escape') {
          operation.endFullScreen();
        }
        return;
      }
    });

    const executeHooks = (hook, data) => {
      if (!view) return;
      const evalJs = `console.log(window.rubick);if(window.rubick && window.rubick.hooks && typeof window.rubick.hooks.on${hook} === 'function' ) {
          try {
            window.rubick.hooks.on${hook}(${data ? JSON.stringify(data) : ''});
          } catch(e) {console.log(e)}
        }
      `;
      view.webContents.executeJavaScript(evalJs);
    };
    return win;
  };

  const getWindow = () => win;

  const operation = {
    minimize: () => {
      win.focus();
      win.minimize();
    },
    maximize: () => {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    },
    close: () => {
      win.close();
    },
    pin: () => {
      win.setAlwaysOnTop(true);
    },
    unpin: () => {
      win.setAlwaysOnTop(false);
    },
    endFullScreen: () => {
      win.isFullScreen() && win.setFullScreen(false);
    },
  };

  return {
    init,
    getWindow,
  };
};
