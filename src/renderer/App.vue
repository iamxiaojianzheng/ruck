<template>
  <div id="components-layout" :class="{ drag: isDrag }" @mousedown="onMouseDown">
    <Search
      :currentPlugin="currentPlugin"
      :searchValue="searchValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :pluginLoading="pluginLoading"
      :pluginHistory="pluginHistory"
      :clipboardFile="clipboardFile || []"
      @changeCurrent="changeIndex"
      @onSearch="onSearch"
      @openMenu="openMenu"
      @changeSelect="changeSelect"
      @choosePlugin="choosePlugin"
      @focus="searchFocus"
      @clear-search-value="clearSearchValue"
      @clearClipbord="clearClipboardFile"
      @readClipboardContent="readClipboardContent"
    />
    <Result
      :pluginHistory="pluginHistory"
      :currentPlugin="currentPlugin"
      :searchValue="searchValue"
      :currentSelect="currentSelect"
      :options="options"
      :clipboardFile="clipboardFile || []"
      @setPluginHistory="setPluginHistory"
      @choosePlugin="choosePlugin"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, ref, toRaw, onMounted } from 'vue';
import { exec } from 'child_process';
import { message } from 'ant-design-vue';
import { getGlobal } from '@electron/remote';
import { ipcRenderer } from 'electron';

import Result from './components/result.vue';
import Search from './components/search.vue';
import getWindowHeight from '../common/utils/getWindowHeight';
import createPluginManager from './plugins-manager';
import useDrag from '../common/utils/dragWindow';
import localConfig from './confOp';
import { PLUGIN_HISTORY } from '@/renderer/constants/renderer';
import type { PluginInfo } from '@/types';

// 拖拽逻辑
const { onMouseDown, isDrag } = useDrag();
const remote = window.require('@electron/remote');

// 插件管理器逻辑
const {
  initPlugins,
  getPluginInfo,
  options,
  onSearch,
  searchValue,
  changeSelect,
  openPlugin,
  currentPlugin,
  placeholder,
  readonly,
  pluginLoading,
  searchFocus,
  clipboardFile,
  setSearchValue,
  clearClipboardFile,
  readClipboardContent,
  pluginHistory,
  setPluginHistory,
  changePluginHistory,
} = createPluginManager();

// 初始化插件
initPlugins();

const currentSelect = ref(0);
const menuPluginInfo = ref<Partial<PluginInfo>>({});
const config = ref<any>(localConfig.getConfig());

// 获取插件市场信息
onMounted(() => {
  getPluginInfo({
    pluginName: 'feature',
    // eslint-disable-next-line no-undef
    pluginPath: `${__static}/feature/package.json`,
  }).then((res) => {
    menuPluginInfo.value = res;
    // 注册到全局插件列表
    remote.getGlobal('LOCAL_PLUGINS').addPlugin(res);
  });
});

// 监听状态变化，调整窗口高度
watch(
  [options, pluginHistory, currentPlugin],
  () => {
    currentSelect.value = 0;
    // 如果当前有运行中的插件，则不调整高度
    if (currentPlugin.value.name) return;

    const height = getWindowHeight(
      options.value,
      pluginLoading.value || !config.value.perf.common.history ? [] : pluginHistory.value
    );
    window.rubick.setExpendHeight(height);
  },
  {
    immediate: true,
    deep: true, // 启用深度监听以检测 pluginHistory 数组的变化
  }
);

// 切换选中项
const changeIndex = (index: number) => {
  const len = options.value.length || pluginHistory.value.length;
  if (!len) return;

  let nextIndex = currentSelect.value + index;
  if (nextIndex > len - 1) {
    nextIndex = 0;
  } else if (nextIndex < 0) {
    nextIndex = len - 1;
  }
  currentSelect.value = nextIndex;
};

// 打开插件市场菜单
const openMenu = (ext: Record<string, any>) => {
  openPlugin({
    ...toRaw(menuPluginInfo.value),
    feature: menuPluginInfo.value.features[0],
    cmd: '插件市场',
    ext,
    click: () => openMenu(ext),
  });
};

// 暴露给全局对象，供插件调用
window.rubick.openMenu = openMenu;

// 选择并执行插件/应用
const choosePlugin = (plugin: any) => {
  // 如果是搜索结果中的项
  if (options.value.length) {
    const currentChoose = options.value[currentSelect.value];
    currentChoose.click();
    return;
  }

  const localPlugins = getGlobal('LOCAL_PLUGINS').getLocalPlugins();
  const currentChoose = plugin || pluginHistory.value[currentSelect.value];

  // 处理应用类型
  if (currentChoose.pluginType === 'app') {
    changePluginHistory(currentChoose);
    try {
      exec(currentChoose.action);
    } catch (e) {
      message.error('启动应用失败');
    }
    return;
  }

  // 检查插件是否已被卸载
  const isInstalled = localPlugins.some((p: any) => p.name === currentChoose.originName);

  if (!isInstalled) {
    const result = window.rubick.db.get(PLUGIN_HISTORY) || {};
    const history = result.data.filter((item: any) => item.originName !== currentChoose.originName);
    setPluginHistory(history);
    return message.warning('插件已被卸载！');
  }

  // 构造新的插件信息并打开
  const newPluginInfo = {
    ...currentChoose,
    ext: {
      code: currentChoose.feature.code,
      type: currentChoose.cmd.type || 'text',
      payload: null,
    },
  };
  window.rubick.openPlugin(JSON.parse(JSON.stringify(newPluginInfo)));

  changePluginHistory(currentChoose);

  // Auto detach if enabled
  const currentConfig = localConfig.getConfig() as any;
  if (currentConfig.pluginSettings?.[currentChoose.name]?.autoDetach) {
    ipcRenderer.send('msg-trigger', {
      type: 'detachPlugin',
    });
  }
};

const clearSearchValue = () => {
  setSearchValue('');
};
</script>

<style lang="less">
@import './assets/var.less';
#components-layout {
  height: 100vh;
  overflow: hidden;
  background: var(--color-body-bg);
  ::-webkit-scrollbar {
    width: 0;
  }
  &.drag {
    -webkit-app-region: drag;
  }
}
</style>
