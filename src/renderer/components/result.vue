<template>
  <div v-show="!currentPlugin.name" class="options">
    <div
      class="history-plugins"
      v-if="!options.length && !searchValue && !clipboardFile.length && config.perf.common.history"
    >
      <a-row>
        <a-col
          @click="() => openPlugin(item)"
          @contextmenu.prevent="openMenu($event, item)"
          :class="currentSelect === index ? 'active history-item' : 'history-item'"
          :span="3"
          v-for="(item, index) in pluginHistory"
          :key="index"
        >
          <a-avatar style="width: 28px; height: 28px" shape="square" :src="item.icon" />
          <div class="name ellpise">
            {{ item.cmd || item.pluginName || item._name || item.name }}
          </div>
          <div class="badge" v-if="item.pin"></div>
        </a-col>
      </a-row>
    </div>
    <a-list v-else item-layout="horizontal" :dataSource="sort(options)">
      <template #renderItem="{ item, index }">
        <a-list-item
          @click="() => item.click()"
          @contextmenu.prevent="openOptionMenu($event, item)"
          :class="currentSelect === index ? 'active op-item' : 'op-item'"
        >
          <a-list-item-meta :description="renderDesc(item.desc)">
            <template #title>
              <span v-html="renderTitle(item.name, item.match)"></span>
            </template>
            <template #avatar>
              <a-avatar style="border-radius: 0" :src="item.logoPath || item.icon" />
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, toRaw, onMounted } from 'vue';
import type { PropType } from 'vue';
import type { RuntimePlugin, PluginInfo, FileInfo, PluginOption, AppConfig } from '@/types';
import type { Menu } from 'electron';
import localConfig from '../confOp';

const path = window.require('path');
const remote = window.require('@electron/remote');

declare const __static: string;

const config = ref<AppConfig>(localConfig.getConfig());

const props = defineProps({
  searchValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array as PropType<PluginOption[]>,
    default: (() => [])(),
  },
  currentSelect: {
    type: Number,
    default: 0,
  },
  currentPlugin: {
    type: Object as PropType<Partial<RuntimePlugin>>,
    default: () => ({}),
  },
  pluginHistory: {
    type: Array as PropType<Array<PluginInfo & { cmd?: string; _name?: string }>>,
    default: () => [],
  },
  clipboardFile: {
    type: Array as PropType<FileInfo[]>,
    default: () => [],
  },
});

const emit = defineEmits(['choosePlugin', 'setPluginHistory']);

const renderTitle = (title: string, match: number[][]) => {
  if (typeof title !== 'string') return;
  if (!props.searchValue || !match) return title;

  let result = '';
  let lastEnd = 0;

  // 按位置排序
  const sortedPositions = [...match].sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedPositions) {
    // 添加未高亮部分
    result += title.substring(lastEnd, start);
    // 添加高亮部分
    result += `<span style='color: var(--ant-error-color)'>${title.substring(start, end + 1)}</span>`;
    lastEnd = end + 1;
  }

  // 添加剩余部分
  result += title.substring(lastEnd);

  return `<div>${result}</div>`;
};

const renderDesc = (desc = '') => {
  if (desc.length > 80) {
    return `${desc.substring(0, 63)}...${desc.substring(desc.length - 14, desc.length)}`;
  }
  return desc;
};

const sort = (options: PluginOption[]) => {
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      if (options[j].zIndex > options[i].zIndex) {
        let temp = options[i];
        options[i] = options[j];
        options[j] = temp;
      }
    }
  }
  return options.slice(0, 20);
};

const openPlugin = (item: PluginInfo) => {
  emit('choosePlugin', item);
};

interface MenuContext {
  plugin: PluginInfo | PluginOption | null;
  source: 'history' | 'option';
}

const menuContext = reactive<MenuContext>({
  plugin: null,
  source: 'history',
});
let mainMenus: Menu;

/**
 * 统一的右键菜单显示函数
 * 根据 source 和 item 类型动态控制菜单项可见性
 */
const showContextMenu = (
  e: MouseEvent,
  item: PluginInfo | PluginOption,
  source: 'history' | 'option'
) => {
  if (!mainMenus) return;

  menuContext.plugin = item;
  menuContext.source = source;

  const isHistory = source === 'history';
  const isApp = item.pluginType === 'app';
  const hasPin = 'pin' in item;

  // 获取所有菜单项
  const removeRecentCmd = mainMenus.getMenuItemById('removeRecentCmd');
  const pinToMain = mainMenus.getMenuItemById('pinToMain');
  const unpinFromMain = mainMenus.getMenuItemById('unpinFromMain');
  const openFolder = mainMenus.getMenuItemById('openFolder');

  // 1. 删除功能：仅在 History 中显示
  removeRecentCmd.visible = isHistory;

  // 2. 固定功能：仅在 History 中且有 pin 属性时显示
  if (isHistory && hasPin) {
    pinToMain.visible = !item.pin;
    unpinFromMain.visible = !!item.pin;
  } else {
    pinToMain.visible = true;
    unpinFromMain.visible = false;
  }

  // 3. 打开文件夹：仅在是本地应用时显示（无论 History 还是 Option）
  openFolder.visible = isApp;

  mainMenus.popup({
    x: e.pageX,
    y: e.pageY,
  });
};

const openMenu = (e: MouseEvent, item: PluginInfo) => {
  showContextMenu(e, item, 'history');
};

const openOptionMenu = (e: MouseEvent, item: PluginOption) => {
  showContextMenu(e, item, 'option');
};

const initMainCmdMenus = () => {
  const menu = [
    {
      id: 'removeRecentCmd',
      label: '从"使用记录"中删除',
      icon: path.join(__static, 'icons', 'delete@2x.png'),
      click: () => {
        const history = props.pluginHistory.filter((item) => item.name !== menuContext.plugin.name);
        emit('setPluginHistory', toRaw(history));
      },
    },
    {
      id: 'pinToMain',
      label: '固定到"搜索面板"',
      icon: path.join(__static, 'icons', 'pin@2x.png'),
      click: () => {
        const pluginHistory = structuredClone(props.pluginHistory);
        if (!pluginHistory.some((item) => item.name === menuContext.plugin.name)) {
          pluginHistory.push(menuContext.plugin as PluginInfo);
        }
        const history = pluginHistory.map((item) => {
          if (item.name === menuContext.plugin.name) {
            item.pin = true;
          }
          return item;
        });
        emit('setPluginHistory', toRaw(history));
      },
    },
    {
      id: 'unpinFromMain',
      label: '从"搜索面板"取消固定',
      icon: path.join(__static, 'icons', 'unpin@2x.png'),
      click: () => {
        const history = props.pluginHistory.map((item) => {
          if (item.name === menuContext.plugin.name) {
            item.pin = false;
          }
          return item;
        });
        emit('setPluginHistory', toRaw(history));
      },
    },
    {
      id: 'openFolder',
      label: '打开所在文件夹',
      icon: path.join(__static, 'icons', 'open-folder@2x.png'),
      click: () => {
        const plugin = menuContext.plugin;
        if (plugin && plugin.pluginType === 'app' && plugin.desc) {
          const targetPath = plugin.desc;
          const folderPath = path.dirname(targetPath);
          // 检查文件夹是否存在
          if (window.require('fs').existsSync(folderPath)) {
            remote.shell.openPath(folderPath);
          }
        }
      },
    },
  ];
  mainMenus = remote.Menu.buildFromTemplate(menu);
};

onMounted(() => {
  initMainCmdMenus();
});
</script>

<style lang="less">
.ellpise {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.contextmenu {
  margin: 0;
  background: #fff;
  z-index: 3000;
  position: absolute;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #333;
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
}

.options {
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  z-index: 99;
  max-height: calc(~'100vh - 60px');
  overflow: auto;
  background: var(--color-body-bg);
  .history-plugins {
    width: 100%;
    border-top: 1px dashed var(--color-border-light);
    box-sizing: border-box;
    max-height: calc(70px * 3); /* 最多显示3排 */
    overflow-y: auto; /* 超过3排时可滚动 */
    overflow-x: hidden;
    .history-item {
      cursor: pointer;
      box-sizing: border-box;
      height: 69px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: var(--color-text-content);
      border-right: 1px dashed var(--color-border-light);
      border-bottom: 1px dashed var(--color-border-light); /* 添加下边框以区分行 */
      position: relative;
      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        height: 0;
        border-radius: 4px;
        border-top: 6px solid var(--ant-primary-4);
        border-right: 6px solid var(--ant-primary-4);
        border-left: 6px solid transparent;
        border-bottom: 6px solid transparent;
      }
      &.active {
        background: var(--color-list-hover);
      }
    }
    .name {
      font-size: 12px;
      margin-top: 4px;
      width: 100%;
      text-align: center;
    }
  }
  .op-item {
    padding: 0 10px;
    height: 70px;
    line-height: 50px;
    max-height: 500px;
    overflow: auto;
    background: var(--color-body-bg);
    color: var(--color-text-content);
    border-color: var(--color-border-light);
    border-bottom: 1px solid var(--color-border-light) !important;
    &.active {
      background: var(--color-list-hover);
    }
    .ant-list-item-meta-title {
      color: var(--color-text-content);
    }
    .ant-list-item-meta-description {
      color: var(--color-text-desc);
    }
  }
}
</style>
