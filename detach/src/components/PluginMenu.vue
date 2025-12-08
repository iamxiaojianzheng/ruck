<template>
  <div class="plugin-menu-container">
    <div class="window-handle" v-if="process.platform !== 'darwin' && isDetach">
      <div class="devtool" v-if="isDev" @click="emit('openDevTool')" title="开发者工具"></div>
      <div
        v-if="isDetach"
        :class="pinStatus ? 'pin' : 'unpin'"
        @click="emit('togglePin')"
        :title="pinStatus ? '取消置顶' : '置顶'"
      ></div>
      <div class="more" @click="showMenu"></div>
      <div class="minimize" @click="emit('minimize')"></div>
      <div class="maximize" @click="emit('maximize')"></div>
      <div class="close" @click="emit('close')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';

const process = window.require('process');
const remote = window.require('@electron/remote');
const { Menu } = remote;

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  currentPlugin: {
    type: Object,
    default: () => ({}),
  },
  isDetach: {
    type: Boolean,
    default: false,
  },
  pinStatus: {
    type: Boolean,
    default: false,
  },
  isDev: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updateConfig', 'detach', 'togglePin', 'openDevTool', 'minimize', 'maximize', 'close']);

const { config, currentPlugin, isDetach, pinStatus, isDev } = toRefs(props);

const isAutoDetach = () => {
  const pluginName = currentPlugin.value.name;
  return config.value.pluginSettings?.[pluginName]?.autoDetach || false;
};

const changeAutoDetach = async () => {
  const pluginName = currentPlugin.value.name;
  let cfg = JSON.parse(JSON.stringify(config.value));
  if (!cfg.pluginSettings) cfg.pluginSettings = {};
  if (!cfg.pluginSettings[pluginName]) cfg.pluginSettings[pluginName] = {};

  const newValue = !cfg.pluginSettings[pluginName].autoDetach;
  cfg.pluginSettings[pluginName].autoDetach = newValue;

  // 通过 IPC 保存插件设置
  await window.detachAPI.updatePluginSetting(pluginName, 'autoDetach', newValue);

  // 更新本地状态
  emit('updateConfig', cfg);
};

const showMenu = () => {
  let pluginMenu: any = [];

  if (currentPlugin.value && currentPlugin.value.logo) {
    pluginMenu.push({
      label: '自动分离为独立窗口',
      type: 'checkbox',
      checked: isAutoDetach(),
      click: changeAutoDetach,
    });
  }

  const menu = Menu.buildFromTemplate(pluginMenu);
  menu.popup();
};
</script>

<style lang="less" scoped>
.plugin-menu-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  .window-handle {
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
    margin-right: 10px;

    & > div {
      width: 36px;
      height: 36px;
      border-radius: 5px;
      cursor: pointer;
    }

    & > div:hover {
      background-color: #dee2e6;
    }
    .devtool {
      background: center no-repeat url('../assets/tool.svg');
    }

    .pin {
      background: center no-repeat url('../assets/pin.svg');
    }

    .unpin {
      background: center no-repeat url('../assets/unpin.svg');
    }

    .more {
      background: center no-repeat url('../assets/more.svg');
    }

    .minimize {
      background: center / 20px no-repeat url('../assets/minimize.svg');
    }

    .maximize {
      background: center / 20px no-repeat url('../assets/maximize.svg');
    }

    .unmaximize {
      background: center / 20px no-repeat url('../assets/unmaximize.svg');
    }

    .close {
      background: center / 20px no-repeat url('../assets/close.svg');
    }

    .close:hover {
      background-color: #e53935 !important;
      background-image: url('../assets/close-hover.svg') !important;
    }
  }
}
</style>
