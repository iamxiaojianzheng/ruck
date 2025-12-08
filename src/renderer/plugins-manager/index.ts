/**
 * 插件管理器模块（渲染进程）
 *
 * 本模块是渲染进程的核心模块，负责管理所有与插件相关的操作，包括：
 *
 * **插件发现与搜索**：
 * - 系统应用搜索（App）
 * - 已安装插件搜索（UI + System）
 * - 本地启动应用搜索
 * - 插件历史记录管理
 * - 快速搜索索引构建
 *
 * **插件生命周期**：
 * - 插件加载
 * - 插件打开/关闭
 * - 插件升级检查
 * - 插件历史记录维护
 *
 * **用户交互**：
 * - 搜索框状态管理
 * - 搜索选项展示
 * - 剪贴板监控
 * - 键盘导航
 *
 * **状态管理**：
 * 使用 Vue3 的 reactive 和 toRefs 管理插件状态，确保响应式更新。
 *
 * @module PluginsManager
 */

import path from 'path';
import { message } from 'ant-design-vue';
import { reactive, toRefs, ref, Ref } from 'vue';
import { getGlobal } from '@electron/remote';
import { nativeImage, ipcRenderer } from 'electron';

import appSearch from '@/core/app-search';
import commonConst from '@/common/utils/commonConst';
import searchManager from './search';
import optionsManager from './options';
import { rebuildPluginIndex } from './search/plugin-index';

import { exec } from 'child_process';
import { PluginHandler } from '@/core';
import { PLUGIN_INSTALL_DIR as baseDir, PLUGIN_HISTORY } from '@/renderer/constants/renderer';
import type { PluginInfo, RuntimePlugin, PluginOption } from '@/types';
import { rendererLogger as logger } from '@/common/logger';

/**
 * 插件管理器状态接口
 *
 * 定义了插件管理器的所有状态数据结构。
 *
 * @interface PluginManagerState
 */
interface PluginManagerState {
  /** 系统应用列表 */
  appList: RuntimePlugin[];
  /** 已安装的插件列表 */
  plugins: PluginInfo[];
  /** 本地插件列表 */
  localPlugins: PluginInfo[];
  /** 当前正在运行的插件 */
  currentPlugin: Partial<RuntimePlugin>;
  /** 插件加载状态 */
  pluginLoading: boolean;
  /** 插件使用历史记录（最多 8 个） */
  pluginHistory: PluginInfo[];
}

/**
 * 创建插件管理器
 *
 * 这是一个工厂函数，返回插件管理器的所有方法和状态。
 * 使用组合式 API 风格，便于在 Vue 组件中使用。
 *
 * @returns 插件管理器实例
 */
const createPluginManager = () => {
  const pluginInstance = new PluginHandler({
    baseDir,
  });

  const state = reactive<PluginManagerState>({
    appList: [],
    plugins: [],
    localPlugins: [],
    currentPlugin: {},
    pluginLoading: false,
    pluginHistory: [],
  });

  const appList: Ref<RuntimePlugin[]> = ref([]);

  /**
   * 初始化插件系统
   *
   * 本方法在应用启动时调用，负责：
   * 1. 初始化插件历史记录
   * 2. 搜索系统应用
   * 3. 初始化本地启动插件
   * 4. 构建插件搜索索引
   * 5. 通知主进程渲染进程就绪
   */
  const initPlugins = async () => {
    logger.info('初始化插件系统开始');
    initPluginHistory();
    appList.value = await appSearch(nativeImage);
    logger.info('系统应用搜索完成', { count: appList.value.length });
    initLocalStartPlugin();

    // 构建插件搜索索引（性能优化）
    rebuildPluginIndex();

    // 通知主进程：渲染进程初始化完成
    ipcRenderer.invoke('renderer:ready');
    logger.info('插件系统初始化完成');
  };

  const initPluginHistory = () => {
    const result = window.rubick.db.get(PLUGIN_HISTORY) || {};
    if (result && result.data) {
      state.pluginHistory = result.data;
    }
  };

  const cleanupDeletedPluginsFromHistory = () => {
    const localPlugins = getGlobal('LOCAL_PLUGINS')?.getLocalPlugins() || [];
    const result = window.rubick.db.get(PLUGIN_HISTORY) || {};

    if (result && result.data) {
      const validHistory = result.data.filter((item: PluginInfo) =>
        localPlugins.some((p: PluginInfo) => p.name === item.name || p.name === item.originName)
      );

      if (validHistory.length !== result.data.length) {
        window.rubick.db.put({
          _id: PLUGIN_HISTORY,
          _rev: result._rev,
          data: validHistory,
        });
        state.pluginHistory = validHistory;
      }
    }
  };

  const initLocalStartPlugin = async () => {
    const result = await window.ruckAPI.dbGet('rubick-local-start-app');
    if (result && result.value) {
      appList.value.push(...result.value);
    }
  };

  window.removeLocalStartPlugin = ({ plugin }) => {
    appList.value = appList.value.filter((app) => app.desc !== plugin.desc);
  };

  window.addLocalStartPlugin = ({ plugin }) => {
    window.removeLocalStartPlugin({ plugin });
    appList.value.push(plugin);
  };

  const loadPlugin = async (plugin: Partial<RuntimePlugin>) => {
    logger.info('开始加载插件', {
      name: plugin.name,
      originName: plugin.originName,
      type: plugin.pluginType,
    });

    setSearchValue('');
    window.ruckAPI.setExpendHeight(60);
    state.pluginLoading = true;
    state.currentPlugin = plugin;
    // 自带的插件不需要检测更新
    if (plugin.name === 'rubick-system-feature') return;
    await pluginInstance.upgrade(plugin.originName);
    state.pluginLoading = false;

    logger.info('插件加载完成', { name: plugin.name });
  };

  /**
   * 打开插件
   *
   * 核心功能：根据插件类型执行不同的打开逻辑。
   *
   * **插件类型**：
   * - UI 插件：在主窗口中显示界面
   * - System 插件：直接加载运行，无界面
   * - App 插件：启动本地应用
   *
   * **自动分离支持**：
   * 如果插件配置了 autoDetach，则在加载后自动分离到独立窗口。
   *
   * @param plugin 插件信息对象
   * @param option 可选项，用于传递额外的加载选项
   */
  const openPlugin = async (plugin: Partial<RuntimePlugin>, option?: PluginOption) => {
    logger.info('打开插件', {
      name: plugin.name,
      type: plugin.pluginType,
    });
    window.ruckAPI.removePlugin();

    window.initRubick();

    if (plugin.pluginType === 'ui' || plugin.pluginType === 'system') {
      if (state?.currentPlugin?.name === plugin.name) {
        window.ruckAPI.showMainWindow();
        return;
      }
      await loadPlugin(plugin);

      const newPluginInfo = JSON.parse(
        JSON.stringify({
          ...plugin,
          ext: plugin.ext || {
            code: plugin.feature?.code,
            type: (plugin.cmd as Cmd)?.type || 'text',
            payload: null,
          },
        })
      );
      window.rubick.openPlugin(newPluginInfo);

      // Check auto detach setting
      const localConfig = await import('../confOp');
      const currentConfig = localConfig.default.getConfig() as any;
      if (currentConfig?.pluginSettings?.[plugin.name]?.autoDetach) {
        // 等待插件加载完成后再分离，确保 view 的 dom-ready 已触发和 bounds 已设置
        setTimeout(() => {
          window.ruckAPI.detachPlugin();
        }, 500);
      }
    }

    if (plugin.pluginType === 'app') {
      try {
        exec(plugin.action);
      } catch (e) {
        message.error('启动应用出错，请确保启动应用存在！');
      }
    }

    changePluginHistory({
      ...plugin,
      ...option,
      originName: plugin.name,
    });
  };

  /**
   * 管理插件历史记录
   *
   * 将最近使用的插件添加到历史记录中。
   * 历史记录最多保存 8 个插件，超过则移除最久未使用的。
   *
   * **固定（Pin）功能**：
   * 用户可以“固定”常用插件，固定的插件不会被移除。
   *
   * @param plugin 插件信息对象
   */
  const changePluginHistory = (plugin) => {
    const unpin = state.pluginHistory.filter((plugin) => !plugin.pin);
    const pin = state.pluginHistory.filter((plugin) => plugin.pin);
    const isPin = state.pluginHistory.find((p) => p.name === plugin.name)?.pin;

    if (isPin) {
      pin.forEach((p, index) => {
        if (p.name === plugin.name) {
          plugin = pin.splice(index, 1)[0];
        }
      });
      pin.unshift(plugin);
    } else {
      unpin.forEach((p, index) => {
        if (p.name === plugin.name) {
          unpin.splice(index, 1);
        }
      });
      unpin.unshift(plugin);
    }

    if (state.pluginHistory.length > 8) {
      unpin.pop();
    }

    state.pluginHistory = [...pin, ...unpin];
    const result = window.rubick.db.get(PLUGIN_HISTORY) || {};
    const newPluginHistory = JSON.parse(JSON.stringify(state.pluginHistory));
    window.rubick.db.put({
      _id: PLUGIN_HISTORY,
      _rev: result._rev,
      data: newPluginHistory,
    });

    logger.debug('添加插件历史记录', {
      pluginName: plugin.name,
      isPinned: isPin,
      historyCount: state.pluginHistory.length,
    });
  };

  const setPluginHistory = (plugins) => {
    state.pluginHistory = plugins;
    const unpin = state.pluginHistory.filter((plugin) => !plugin.pin);
    const pin = state.pluginHistory.filter((plugin) => plugin.pin);
    state.pluginHistory = [...pin, ...unpin];
    const result = window.rubick.db.get(PLUGIN_HISTORY) || {};
    const newPluginHistory = JSON.parse(JSON.stringify(state.pluginHistory));
    window.rubick.db.put({
      _id: PLUGIN_HISTORY,
      _rev: result._rev,
      data: newPluginHistory,
    });
  };

  const { searchValue, onSearch, setSearchValue, subInputReadonly, placeholder, readonly } = searchManager();
  const { options, searchFocus, setOptionsRef, clipboardFile, clearClipboardFile, readClipboardContent } =
    optionsManager({
      searchValue,
      appList,
      openPlugin,
      currentPlugin: toRefs(state).currentPlugin,
    });

  // plugin operation
  const getPluginInfo = async ({ pluginName, pluginPath }) => {
    const pluginInfo = await pluginInstance.getAdapterInfo(pluginName, pluginPath);
    return {
      ...pluginInfo,
      icon: pluginInfo.logo,
      indexPath: commonConst.dev()
        ? 'http://localhost:8081/#/'
        : `file://${path.join(pluginPath, '../', pluginInfo.main)}`,
    };
  };

  const changeSelect = (select) => {
    state.currentPlugin = select;
  };

  const addPlugin = (plugin: any) => {
    state.plugins.unshift(plugin);
  };

  const removePlugin = (plugin: any) => {
    // todo
  };

  window.loadPlugin = (plugin) => loadPlugin(plugin);

  window.updatePlugin = ({ currentPlugin }: any) => {
    state.currentPlugin = currentPlugin;
    getGlobal('LOCAL_PLUGINS').updatePlugin(currentPlugin);
  };

  window.setCurrentPlugin = ({ currentPlugin }) => {
    state.currentPlugin = currentPlugin;
    setSearchValue('');
  };

  window.initRubick = () => {
    state.currentPlugin = {};
    subInputReadonly(false);
    setSearchValue('');
    setOptionsRef([]);
    window.setSubInput({ placeholder: '' });

    // 清理已删除插件的历史记录
    cleanupDeletedPluginsFromHistory();
    // 重新加载历史记录
    initPluginHistory();

    // 重建插件索引，确保搜索结果是最新的
    // 这样当用户从插件市场返回主窗口时，能搜索到新安装的插件
    rebuildPluginIndex();

    // 主动聚焦主输入框，确保退出插件后用户可以直接输入
    setTimeout(() => {
      const mainInput = document.getElementById('search');
      if (mainInput) {
        (mainInput as HTMLInputElement).focus();
      }
    }, 0);
  };

  window.pluginLoaded = () => {
    state.pluginLoading = false;
  };

  window.searchFocus = (args, strict) => {
    window.ruckAPI.removePlugin();
    window.initRubick();
    searchFocus(args, strict);
  };

  return {
    ...toRefs(state),
    initPlugins,
    addPlugin,
    removePlugin,
    onSearch,
    getPluginInfo,
    openPlugin,
    changeSelect,
    options,
    searchValue,
    placeholder,
    readonly,
    searchFocus,
    setSearchValue,
    clipboardFile,
    clearClipboardFile,
    readClipboardContent,
    setPluginHistory,
    changePluginHistory,
  };
};

export default createPluginManager;
