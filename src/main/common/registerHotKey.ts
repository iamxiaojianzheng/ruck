/**
 * 全局快捷键注册模块
 * 
 * 本模块负责管理 Ruck 应用的所有全局快捷键，包括：
 * - 主窗口显示/隐藏快捷键（支持普通快捷键和双击修饰键）
 * - 截图快捷键
 * - 分离窗口快捷键（动态注册和取消注册）
 * - 用户自定义全局快捷键
 * 
 * @module registerHotKey
 */

import { globalShortcut, nativeTheme, BrowserWindow, WebContentsView, ipcMain, app, Notification } from 'electron';
import screenCapture from '@/core/screen-capture';
import localConfig from '@/main/common/initLocalConfig';
import { mainWindowShowAndHide } from './mainWindow';
import { uIOhook, UiohookKey } from 'uiohook-napi';

/**
 * 模块级变量：缓存主窗口和 API 实例引用
 * 用于在分离窗口快捷键的注册和取消注册中使用
 */
let cachedMainWindow: BrowserWindow | null = null;
let cachedAPI: any = null;

/**
 * 注册所有全局快捷键
 * 
 * 本函数是快捷键注册的入口点，负责：
 * 1. 设置开机启动
 * 2. 设置暗黑模式和主题
 * 3. 注册主窗口显示/隐藏快捷键（支持普通快捷键和双击修饰键）
 * 4. 注册截图快捷键
 * 5. 注册用户自定义全局快捷键
 * 6. 监听配置变更并重新注册快捷键
 * 
 * @param mainWindow 主窗口实例
 * @param API API 实例，包含所有窗口操作方法
 * 
 * @example
 * ```typescript
 * const mainWindow = createMainWindow();
 * const api = new API();
 * registerHotKey(mainWindow, api);
 * ```
 */
const registerHotKey = (mainWindow: BrowserWindow, API: any): void => {
  // 保存引用供后续使用
  cachedMainWindow = mainWindow;
  cachedAPI = API;

  // 设置开机启动
  const setAutoLogin = async () => {
    const config = await localConfig.getConfig();
    if (app.getLoginItemSettings().openAtLogin !== config.perf.common.start) {
      app.setLoginItemSettings({
        openAtLogin: config.perf.common.start,
        openAsHidden: true,
      });
    }
  };

  const setTheme = async () => {
    mainWindow.webContents.executeJavaScript(`window.rubick.changeTheme()`);
    mainWindow.contentView.children.forEach((view: WebContentsView) => {
      view.webContents.executeJavaScript(`window.rubick.changeTheme()`);
    });
  };

  // 设置暗黑模式
  const setDarkMode = async () => {
    const config = await localConfig.getConfig();
    const isDark = config.perf.common.darkMode;
    if (isDark) {
      nativeTheme.themeSource = 'dark';
      mainWindow.webContents.executeJavaScript(`document.body.classList.add("dark");window.rubick.theme="dark"`);
      mainWindow.contentView.children.forEach((view: WebContentsView) => {
        view.webContents.executeJavaScript(`document.body.classList.add("dark");window.rubick.theme="dark"`);
      });
    } else {
      nativeTheme.themeSource = 'light';
      mainWindow.webContents.executeJavaScript(`document.body.classList.remove("dark");window.rubick.theme="light"`);
      mainWindow.contentView.children.forEach((view: WebContentsView) => {
        view.webContents.executeJavaScript(`document.body.classList.remove("dark");window.rubick.theme="light"`);
      });
    }
  };

  // 显示主窗口
  function mainWindowPopUp() {
    mainWindowShowAndHide(mainWindow);
  }

  const init = async () => {
    await setAutoLogin();
    await setDarkMode();
    await setTheme();
    const config = await localConfig.getConfig();
    globalShortcut.unregisterAll();

    // 注册偏好快捷键
    // 处理显示/隐藏快捷键的注册
    const doublePressShortcuts = ['Ctrl+Ctrl', 'Option+Option', 'Shift+Shift', 'Command+Command'];
    const isDoublePressShortcut = doublePressShortcuts.includes(config.perf.shortCut.showAndHidden);

    if (isDoublePressShortcut) {
      // 双击快捷键（如 Ctrl+Ctrl）详见 uIOhookRegister 函数实现
    } else {
      // 注册普通快捷键（如 Ctrl+Space、F8 等）
      globalShortcut.register(config.perf.shortCut.showAndHidden, () => {
        mainWindowPopUp();
      });
    }

    // 截图快捷键
    globalShortcut.register(config.perf.shortCut.capture, () => {
      screenCapture(mainWindow, (data) => {
        data &&
          new Notification({
            title: '截图完成',
            body: '截图已存储到系统剪贴板中',
          }).show();
      });
    });

    globalShortcut.register(config.perf.shortCut.quit, () => {
      // mainWindow.webContents.send('init-rubick');
      // mainWindow.show();
    });

    // 分离窗口快捷键改为动态注册，不在初始化时注册
    // 将在插件打开时注册，插件关闭时取消注册

    // 添加局部快捷键监听
    // mainWindow.webContents.on('before-input-event', (event, input) => {
    //   if (input.key.toLowerCase() === 'w' && (input.control || input.meta) && !input.alt && !input.shift) {
    //     event.preventDefault();
    //     if (mainWindow && !mainWindow.isDestroyed()) {
    //       mainWindow.hide();
    //     }
    //   }
    // });

    // 注册自定义全局快捷键
    config.global.forEach((sc) => {
      if (!sc.key || !sc.value) return;
      globalShortcut.register(sc.key, () => {
        mainWindow.webContents.send('global-short-key', sc.value);
      });
    });
  };

  uIOhookRegister(mainWindowPopUp);
  init();
  ipcMain.on('re-register', () => {
    init();
  });
};
export default registerHotKey;

/**
 * 使用 uIOhook 注册双击修饰键监听
 * 
 * 本函数专门用于处理双击修饰键（如 Ctrl+Ctrl、Option+Option）的快捷键注册。
 * Electron 的 globalShortcut API 不支持双击修饰键，因此使用 uIOhook 库进行底层键盘监听。
 * 
 * 工作原理：
 * 1. 监听所有键盘按下事件
 * 2. 检测是否为配置的修饰键
 * 3. 计算两次按键的时间间隔
 * 4. 如果间隔小于 300ms，触发回调
 * 
 * @param callback 当检测到双击修饰键时的回调函数
 * 
 * @example
 * ```typescript
 * uIOhookRegister(() => {
 *   mainWindow.show();
 * });
 * ```
 */
function uIOhookRegister(callback: () => void) {
  let lastModifierPress = Date.now();
  uIOhook.on('keydown', async (uio_event) => {
    const config = await localConfig.getConfig(); // 此处还有优化空间

    const defaultShort = ['Ctrl+Ctrl', 'Option+Option', 'Shift+Shift', 'Command+Command'];
    if (!defaultShort.includes(config.perf.shortCut.showAndHidden)) {
      return;
    }

    // 双击快捷键，如 Ctrl+Ctrl
    const modifers = config.perf.shortCut.showAndHidden.split('+');
    const showAndHiddenKeyStr = modifers.pop(); // Ctrl
    const keyStr2uioKeyCode = {
      Ctrl: UiohookKey.Ctrl,
      Shift: UiohookKey.Shift,
      Option: UiohookKey.Alt,
      Command: UiohookKey.Comma,
    };

    if (uio_event.keycode === keyStr2uioKeyCode[showAndHiddenKeyStr]) {
      const currentTime = Date.now();
      if (currentTime - lastModifierPress < 300) {
        callback(); // 调用 mainWindowPopUp
      }
      lastModifierPress = currentTime;
    }
  });
  uIOhook.start();
}

/**
 * 注册分离窗口快捷键
 * 应在插件打开时调用
 */
export const registerSeparateShortcut = async (): Promise<void> => {
  console.log('[registerSeparateShortcut] 开始注册分离窗口快捷键');

  if (!cachedMainWindow || !cachedAPI) {
    console.warn('[registerSeparateShortcut] Cannot register separate shortcut: mainWindow or API not cached');
    return;
  }

  const config = await localConfig.getConfig();
  const shortcut = config.perf.shortCut.separate;

  console.log('[registerSeparateShortcut] 快捷键配置:', shortcut);

  if (!shortcut) {
    console.warn('[registerSeparateShortcut] 快捷键配置为空，跳过注册');
    return;
  }

  // 先取消注册，避免重复注册
  globalShortcut.unregister(shortcut);

  // 注册分离窗口快捷键
  const success = globalShortcut.register(shortcut, () => {
    console.log('[registerSeparateShortcut] 快捷键被触发');
    if (cachedAPI && cachedMainWindow) {
      cachedAPI.detachPlugin(null, cachedMainWindow);
    }
  });

  if (!success) {
    console.warn(`[registerSeparateShortcut] Failed to register separate shortcut: ${shortcut}`);
  } else {
    console.log(`[registerSeparateShortcut] ✅ 成功注册分离窗口快捷键: ${shortcut}`);
  }
};


/**
 * 取消注册分离窗口快捷键
 * 应在插件关闭时调用
 */
export const unregisterSeparateShortcut = async (): Promise<void> => {
  console.log('[unregisterSeparateShortcut] 开始取消注册分离窗口快捷键');

  const config = await localConfig.getConfig();
  const shortcut = config.perf.shortCut.separate;

  if (!shortcut) {
    console.warn('[unregisterSeparateShortcut] 快捷键配置为空，跳过取消注册');
    return;
  }

  globalShortcut.unregister(shortcut);
  console.log(`[unregisterSeparateShortcut] ✅ 已取消注册分离窗口快捷键: ${shortcut}`);
};
