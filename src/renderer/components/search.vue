<template>
  <div class="rubick-select">
    <div :class="clipboardFile[0].name ? 'clipboard-tag' : 'clipboard-img'" v-if="!!clipboardFile.length">
      <img style="margin-right: 8px" :src="getIcon()" />
      <div class="ellipse">{{ clipboardFile[0].name }}</div>
      <a-tag color="#aaa" v-if="clipboardFile.length > 1">
        {{ clipboardFile.length }}
      </a-tag>
    </div>
    <div v-else :class="currentPlugin.cmd ? 'rubick-tag' : ''">
      <img @click="clickLogo" class="rubick-logo" :src="currentPlugin.logo || config.perf.custom.logo" />
      <div class="select-tag" v-show="currentPlugin.cmd">
        {{ currentPlugin.cmd }}
      </div>
    </div>
    <a-input
      id="search"
      ref="mainInput"
      class="main-input"
      :value="searchValue"
      :readOnly="readonly"
      :placeholder="pluginLoading ? '更新检测中...' : placeholder || config.perf.custom.placeholder"
      @input="(e) => changeValue(e)"
      @keydown="handleKeydown"
      @keypress.enter="(e) => keydownEvent(e, 'enter')"
      @focus="emit('focus')"
      @blur="handleBlur"
    >
      <template #suffix>
        <div class="suffix-tool">
          <PluginMenu
            :config="config"
            :currentPlugin="currentPlugin"
            @updateConfig="updateConfig"
            @detach="handleDetach"
          />
        </div>
      </template>
    </a-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ipcRenderer } from 'electron';
import type { Ref, PropType } from 'vue';
import type { RuntimePlugin, FileInfo, AppConfig } from '@/types';
import PluginMenu from './PluginMenu.vue';
import localConfig from '../confOp';

const config: Ref = ref(localConfig.getConfig());

const props = defineProps({
  searchValue: {
    type: [String, Number],
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  pluginHistory: {
    type: Array,
    default: () => [],
  },
  currentPlugin: {
    type: Object as PropType<Partial<RuntimePlugin>>,
    default: () => ({}),
  },
  pluginLoading: Boolean,
  clipboardFile: {
    type: Array as PropType<FileInfo[]>,
    default: () => [],
  },
});

const clickLogo = () => {
  const { name } = props.currentPlugin;
  if (!name || name === 'rubick-system-feature') {
    emit('openMenu');
  }
};

const changeValue = (e: Event) => {
  // if (props.currentPlugin.name === 'rubick-system-feature') return;
  const target = e.target as HTMLInputElement;
  targetSearch({ value: target.value });
  emit('onSearch', e);
};

const emit = defineEmits([
  'onSearch',
  'changeCurrent',
  'openMenu',
  'changeSelect',
  'choosePlugin',
  'focus',
  'clearSearchValue',
  'readClipboardContent',
  'clearClipbord',
]);

const keydownEvent = (e: KeyboardEvent, key: string) => {
  // key !== 'space' && e.preventDefault();
  const { ctrlKey, shiftKey, altKey, metaKey } = e;
  const modifiers: Array<string> = [];
  ctrlKey && modifiers.push('control');
  shiftKey && modifiers.push('shift');
  altKey && modifiers.push('alt');
  metaKey && modifiers.push('meta');
  
  // 发送键盘事件到插件
  window.ruckAPI.sendPluginKeyDown(e.code, modifiers);
  const runPluginDisable = ((e.target as HTMLInputElement).value === '' && !props.pluginHistory.length) || props.currentPlugin.name;
  switch (key) {
    case 'up':
      emit('changeCurrent', -1);
      break;
    case 'down':
      emit('changeCurrent', 1);
      break;
    case 'left':
      emit('changeCurrent', -1);
      break;
    case 'right':
      emit('changeCurrent', 1);
      break;
    case 'enter':
      if (runPluginDisable) return;
      emit('choosePlugin');
      break;
    case 'space':
      if (runPluginDisable || !config.value.perf.common.space) return;
      e.preventDefault();
      emit('choosePlugin');
      break;
    default:
      break;
  }
};

// 监听主进程发来的 ESC 键事件
ipcRenderer.on('escape-key-pressed', async () => {
  // 如果输入框有内容，清空内容
  if (props.searchValue) {
    emit('clearSearchValue');
  } else {
    // 输入框没有内容，隐藏窗口
    await window.ruckAPI.hideWindow();
  }
});

const checkNeedInit = (e: KeyboardEvent) => {
  const { ctrlKey, metaKey } = e;

  if ((e.target as HTMLInputElement).value === '' && e.keyCode === 8) {
    closeTag();
  }
  // 手动粘贴
  if ((ctrlKey || metaKey) && e.key === 'v') {
    emit('readClipboardContent');
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  checkNeedInit(e);

  let key = '';
  if (e.key === 'ArrowUp') key = 'up';
  else if (e.key === 'ArrowDown') key = 'down';
  else if (e.key === 'ArrowLeft') key = 'left';
  else if (e.key === 'ArrowRight') key = 'right';
  else if (e.key === 'Tab') key = 'down';

  if (key) {
    keydownEvent(e, key);
  }
};

const targetSearch = ({ value }: { value: string }) => {
  if (props.currentPlugin.name) {
    window.ruckAPI.sendSubInputChange(value);
  }
};

const closeTag = async () => {
  emit('changeSelect', {});
  emit('clearClipbord');
  await window.ruckAPI.removePlugin();
};

const updateConfig = (cfg: AppConfig) => {
  localConfig.setConfig(cfg);
  config.value = cfg;
};

const handleDetach = async () => {
  await window.ruckAPI.detachPlugin();
};

const getIcon = async () => {
  if (props.clipboardFile[0].dataUrl) return props.clipboardFile[0].dataUrl;
  try {
    return await window.ruckAPI.getFileIcon(props.clipboardFile[0].path);
  } catch (e) {
    return require('../assets/file.png');
  }
};

const mainInput = ref(null);

// 处理输入框失焦事件，自动重新聚焦
const handleBlur = () => {
  // 如果当前没有运行插件，则自动重新聚焦到输入框
  // 这样可以确保用户在任何时候都可以直接输入，无需手动点击输入框
  if (!props.currentPlugin.name) {
    setTimeout(() => {
      (mainInput.value as unknown as HTMLInputElement)?.focus();
    }, 100);
  }
};

window.rubick.hooks.onShow = () => {
  // console.log('onShow');
  (mainInput.value as unknown as HTMLDivElement).focus();
};

window.rubick.hooks.onHide = () => {
  emit('clearSearchValue');
};
</script>

<style lang="less">
.rubick-select {
  display: flex;
  padding-left: 16px;
  background: var(--color-body-bg);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  align-items: center;
  height: 60px;
  display: flex;
  align-items: center;
  .ellipse {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }
  .rubick-tag {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    height: 40px;
    border-radius: 9px;
    background: var(--color-list-hover);
  }
  .select-tag {
    white-space: pre;
    user-select: none;
    font-size: 16px;
    color: var(--color-text-primary);
    margin-left: 8px;
  }

  .main-input {
    height: 40px !important;
    box-sizing: border-box;
    flex: 1;
    border: none;
    outline: none;
    box-shadow: none !important;
    background: var(--color-body-bg);
    padding-left: 8px;
    .ant-select-selection,
    .ant-input,
    .ant-select-selection__rendered {
      caret-color: var(--ant-primary-color);
      height: 100% !important;
      font-size: 16px;
      border: none !important;
      background: var(--color-body-bg);
      color: var(--color-text-primary);
    }
  }

  .rubick-logo {
    width: 32px;
    // border-radius: 100%;
  }
  .icon-tool {
    width: 40px;
    height: 40px;
    background: #574778;
    display: flex;
    align-items: center;
    justify-content: center;
    // border-radius: 100%;
    img {
      width: 32px;
    }
  }
  .icon-tool {
    background: var(--color-input-hover);
  }
  .ant-input:focus {
    border: none;
    box-shadow: none;
  }
  .suffix-tool {
    display: flex;
    align-items: center;
    .icon-more {
      font-size: 26px;
      font-weight: bold;
      cursor: pointer;
      color: var(--color-text-content);
    }
    .loading {
      color: var(--ant-primary-color);
      position: absolute;
      top: 0;
      left: 0;
    }
    .update-tips {
      position: absolute;
      right: 46px;
      top: 50%;
      font-size: 14px;
      transform: translateY(-50%);
      color: #aaa;
    }
  }
  .clipboard-tag {
    white-space: pre;
    user-select: none;
    font-size: 16px;
    height: 32px;
    position: relative;
    align-items: center;
    display: flex;
    border: 1px solid var(--color-border-light);
    padding: 0 8px;
    margin-right: 12px;
    img {
      width: 24px;
      height: 24px;
      margin-right: 6px;
    }
  }
  .clipboard-img {
    white-space: pre;
    user-select: none;
    font-size: 16px;
    height: 32px;
    position: relative;
    align-items: center;
    display: flex;
    img {
      width: 32px;
      height: 32px;
    }
  }
}
</style>
