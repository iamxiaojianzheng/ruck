<template>
  <div class="plugin-menu-icon" @click="showMenu">
    <slot>
      <MoreOutlined class="icon-more" />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { ipcRenderer } from 'electron';
import { MoreOutlined } from '@ant-design/icons-vue';
import type { PropType } from 'vue';
import type { AppConfig, RuntimePlugin } from '@/types';
import localConfig from '../confOp';

const remote = window.require('@electron/remote');
const { Menu } = remote;

const props = defineProps({
  config: {
    type: Object as PropType<AppConfig>,
    required: true,
  },
  currentPlugin: {
    type: Object as PropType<Partial<RuntimePlugin>>,
    default: () => ({}),
  },
  showDetachOption: {
    type: Boolean,
    default: true,
  },
  isDetach: {
    type: Boolean,
    default: false,
  },
  pinStatus: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updateConfig', 'detach', 'togglePin']);

const { config, currentPlugin, showDetachOption, isDetach, pinStatus } = toRefs(props);

const isAutoDetach = () => {
  const pluginName = currentPlugin.value.name;
  return config.value.pluginSettings?.[pluginName]?.autoDetach || false;
};

const changeAutoDetach = () => {
  const pluginName = currentPlugin.value.name;
  let cfg = JSON.parse(JSON.stringify(config.value));
  if (!cfg.pluginSettings) {
    cfg.pluginSettings = {};
  }
  if (!cfg.pluginSettings[pluginName]) {
    cfg.pluginSettings[pluginName] = {};
  }
  cfg.pluginSettings[pluginName].autoDetach = !cfg.pluginSettings[pluginName].autoDetach;
  emit('updateConfig', cfg);
};

const changeHideOnBlur = () => {
  let cfg = JSON.parse(JSON.stringify(config.value));
  cfg.perf.common.hideOnBlur = !cfg.perf.common.hideOnBlur;
  emit('updateConfig', cfg);
};

const changeLang = (lang: string) => {
  let cfg = JSON.parse(JSON.stringify(config.value));
  cfg.perf.common.lang = lang;
  emit('updateConfig', cfg);
};

const showMenu = () => {
  // 刷新配置，确保获取最新值（可能在 detach 窗口中被修改）
  const latestConfig = localConfig.getConfig();
  if (latestConfig) {
    emit('updateConfig', latestConfig);
  }
  
  // 使用最新获取的配置来构建菜单
  const currentConfig = latestConfig || config.value;
  
  let pluginMenu: any = [];

  if (isDetach.value) {
    pluginMenu.push({
      label: pinStatus.value ? '取消置顶' : '置顶',
      click: () => emit('togglePin'),
    });
  } else {
    pluginMenu.push({
      label: currentConfig.perf.common.hideOnBlur ? '钉住' : '自动隐藏',
      click: changeHideOnBlur,
    });
  }

  pluginMenu.push({
    label: currentConfig.perf.common.lang === 'zh-CN' ? '切换语言' : 'Change Language',
    submenu: [
      {
        label: '简体中文',
        click: () => {
          changeLang('zh-CN');
        },
      },
      {
        label: 'English',
        click: () => {
          changeLang('en-US');
        },
      },
    ],
  });

  if (currentPlugin.value && currentPlugin.value.logo) {
    const otherMenu: any[] = [
      {
        label: '插件应用设置',
        submenu: [
          {
            label: '自动分离为独立窗口',
            type: 'checkbox',
            checked: currentConfig.pluginSettings?.[currentPlugin.value.name]?.autoDetach || false,
            click: changeAutoDetach,
          },
        ],
      },
    ];

    if (showDetachOption.value) {
      otherMenu.push({
        label: '分离窗口',
        click: () => {
          emit('detach');
        },
      });
    }

    if (ipcRenderer.sendSync('msg-trigger', { type: 'isDev' })) {
      otherMenu.unshift({
        label: '开发者工具',
        click: () => {
          ipcRenderer.send('msg-trigger', { type: 'openPluginDevTools' });
        },
      });
    }

    pluginMenu = pluginMenu.concat(otherMenu);
  }
  const menu = Menu.buildFromTemplate(pluginMenu);
  menu.popup();
};
</script>

<style lang="less" scoped>
.plugin-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  .icon-more {
    font-size: 26px;
    font-weight: bold;
    cursor: pointer;
    color: var(--color-text-content);
  }
}
</style>
