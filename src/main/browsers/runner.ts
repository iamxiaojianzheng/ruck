import { BrowserView, BrowserWindow, session } from 'electron';
import * as remote from '@electron/remote/main';
import path from 'path';
import fs from 'fs';
import commonConst from '../../common/utils/commonConst';
import { PLUGIN_INSTALL_DIR as baseDir } from '@/common/constants/main';
import localConfig from '@/main/common/initLocalConfig';
import { WINDOW_CONFIG } from '@/common/constants';

const getRelativePath = (indexPath) => {
  return commonConst.windows() ? indexPath.replace('file://', '') : indexPath.replace('file:', '');
};

const getPreloadPath = (plugin, pluginIndexPath) => {
  const { name, preload, tplPath, indexPath } = plugin;
  if (!preload) return;

  console.log(path.resolve(getRelativePath(pluginIndexPath), `../`, preload));
  if (commonConst.dev()) {
    if (name === 'rubick-system-feature') {
      return path.resolve(__static, `../feature/public/preload.js`);
    }
  }

  if (tplPath) {
    return path.resolve(getRelativePath(indexPath), `./`, preload);
  }
  return path.resolve(getRelativePath(pluginIndexPath), `../`, preload);
};

export default (): RunnerBrowser => {
  let _view: any;

  // 定义 getter/setter 来追踪 view 的所有修改
  const viewHandler = {
    get: () => {
      return _view;
    },
    set: (newValue: any) => {
      console.log('[runner] VIEW BEING SET! old:', _view, 'new:', newValue);
      console.log('[runner] Stack trace:', new Error().stack);
      _view = newValue;
    }
  };

  // 使用 getter/setter 替代直接变量
  Object.defineProperty(viewHandler, 'value', {
    get: viewHandler.get,
    set: viewHandler.set
  });

  // 注意：由于 JS 限制，我们需要在代码中使用 _view 而不是通过 proxy
  // 让我们先添加日志，然后直接修改 view 赋值的地方
  let view: any;

  const viewReadyFn = async (window, { pluginSetting, ext }) => {
    if (!view) return;
    const height = pluginSetting && pluginSetting.height;
    window.setSize(WINDOW_CONFIG.WIDTH, height || WINDOW_CONFIG.PLUGIN_HEIGHT);

    view.setBounds({
      x: 0,
      y: WINDOW_CONFIG.HEIGHT,
      width: WINDOW_CONFIG.WIDTH,
      height: height || WINDOW_CONFIG.PLUGIN_HEIGHT - WINDOW_CONFIG.HEIGHT,
    });

    // window.on('resize', () => {
    //   if (!window || !view) return;
    //   const { width, height } = window.getBounds();
    //   view.setBounds({ x: 0, y: 0, width, height: height || WINDOW_PLUGIN_HEIGHT - WINDOW_HEIGHT });
    // });
    view.setAutoResize({ width: true, height: true });

    executeHooks('PluginEnter', ext);
    executeHooks('PluginReady', ext);
    const config = await localConfig.getConfig();
    const darkMode = config.perf.common.darkMode;
    darkMode && view.webContents.executeJavaScript(`document.body.classList.add("dark");window.rubick.theme="dark"`);
    window.webContents.executeJavaScript(`window.pluginLoaded()`);
  };

  const init = (plugin, window: BrowserWindow) => {
    if (view === null || view === undefined || (view as any).inDetach) {
      createView(plugin, window);
      remote.enable(view.webContents);
    }
  };

  const createView = (plugin, window: BrowserWindow) => {
    console.log('runner createView');
    const {
      tplPath,
      indexPath,
      development,
      name,
      originName,
      preload,
      main = 'index.html',
      pluginSetting,
      ext,
    } = plugin;
    // console.log(plugin);
    const pluginPath = path.resolve(baseDir, 'node_modules', originName || name);
    let pluginIndexPath = tplPath || indexPath;

    // 开发环境
    if (commonConst.dev() && development) {
      pluginIndexPath = development;
    }

    // 再尝试去找
    if (plugin.name === 'rubick-system-feature' && !pluginIndexPath) {
      pluginIndexPath = commonConst.dev() ? 'http://localhost:8081/#/' : `file://${__static}/feature/index.html`;
    } else if (!pluginIndexPath) {
      pluginIndexPath = `file://${path.join(pluginPath, './', main)}`;
    }

    let preloadPath;
    if (preload) {
      preloadPath = `${path.join(pluginPath, './', preload)}`;
    }

    // console.log(preloadPath, pluginIndexPath);
    if (!fs.existsSync(preloadPath)) {
      preloadPath = getPreloadPath(plugin, pluginIndexPath);
    }
    // console.log(preloadPath);

    const ses = session.fromPartition('<' + name + '>');
    ses.setPreloads([`${__static}/preload.js`]);

    view = new BrowserView({
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: false,
        devTools: commonConst.dev(),
        webviewTag: true,
        preload: preloadPath,
        session: ses,
        defaultFontSize: 14,
        defaultFontFamily: {
          standard: 'system-ui',
          serif: 'system-ui',
        },
        spellcheck: false,
      },
    });
    window.setBrowserView(view);
    view.webContents.loadURL(pluginIndexPath);
    view.webContents.once('dom-ready', () => viewReadyFn(window, plugin));
    // 修复请求跨域问题
    view.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      callback({
        requestHeaders: { referer: '*', ...details.requestHeaders },
      });
    });

    view.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          'Access-Control-Allow-Origin': ['*'],
          ...details.responseHeaders,
        },
      });
    });
  };

  const removeView = (window: BrowserWindow) => {
    if (!view) return;
    executeHooks('PluginOut', null);
    // 先记住这次要移除的视图，防止后面异步代码里全局引用被换掉
    const snapshotView = view;
    setTimeout(() => {
      // 获取当前视图，判断是否已经换成了新视图
      const currentView = window.getBrowserView?.();
      window.removeBrowserView(snapshotView);

      // 主窗口的插件视图仍然挂着旧实例时，需要还原主窗口 UI
      if (!snapshotView.inDetach) {
        // 如果窗口还挂着旧视图，说明还没换掉，需要把主窗口恢复到初始状态
        if (currentView === snapshotView) {
          window.setBrowserView(null);
          if (view === snapshotView) {
            window.webContents?.executeJavaScript(`window.initRubick()`);
            // 主进程层面恢复焦点到主窗口
            window.webContents.focus();
            view = undefined;
          }
        }
        snapshotView.webContents?.destroy();
      }
      // 分离窗口只需释放全局引用，视图由分离窗口继续管理
      else if (view === snapshotView) {
        view = undefined;
      }
    }, 0);
  };

  const getView = () => view;

  const closeView = () => {
    view?.webContents?.close();
    view = undefined;
  };

  const executeHooks = (hook, data) => {
    if (!view) return;
    const evalJs = `if(window.rubick && window.rubick.hooks && typeof window.rubick.hooks.on${hook} === 'function' ) {
          try {
            window.rubick.hooks.on${hook}(${data ? JSON.stringify(data) : ''});
          } catch(e) {}
        }
      `;
    view.webContents?.executeJavaScript(evalJs);
  };

  return {
    init,
    getView,
    closeView,
    removeView,
    executeHooks,
  };
};
