<template>
  <div :class="[process.platform, 'detach']">
    <div class="info">
      <img :src="pluginInfo.logo" />
      <input
        autofocus
        @input="changeValue"
        v-if="showInput"
        :value="pluginInfo.subInput?.value"
        :placeholder="pluginInfo.subInput?.placeholder"
      />
      <span v-else>{{ pluginInfo.pluginName }}</span>
    </div>
    <PluginMenu
      :config="config"
      :currentPlugin="pluginInfo"
      :showDetachOption="false"
      :isDetach="true"
      :pinStatus="pinStatus"
      :isDev="isDev"
      @updateConfig="updateConfig"
      @togglePin="pinWindow"
      @openDevTool="openDevTool"
      @minimize="minimize"
      @maximize="maximize"
      @close="close"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import throttle from 'lodash.throttle';
import PluginMenu from './components/PluginMenu.vue';

const { ipcRenderer } = window.require('electron');

const process = window.require('process');
const showInput = ref(false);
const isDev = ref(false);

const storeInfo = localStorage.getItem('rubick-system-detach') || '{}';
const pluginInfo = ref({});
const config = ref({});

window.initDetach = (info) => {
  const { subInput } = info;
  pluginInfo.value = info;
  pluginInfo.value.pin = false;
  showInput.value = subInput && (!!subInput.value || !!subInput.placeholder);
  localStorage.setItem('rubick-system-detach', JSON.stringify(info));
  isDev.value = ipcRenderer.sendSync('msg-trigger', { type: 'isDev' }) === true;

  // Fetch config from detach:service
  try {
    config.value = ipcRenderer.sendSync('detach:service', { type: 'getConfig' }) || {};
  } catch (e) {
    console.error(e);
  }
};

const pinStatus = computed(() => {
  const { pin } = pluginInfo.value;
  return pin === true ? true : false;
});

try {
  window.initDetach(JSON.parse(storeInfo));
} catch (e) {
  // ...
}

const changeValue = throttle((e) => {
  ipcRenderer.send('msg-trigger', {
    type: 'detachInputChange',
    data: {
      text: e.target.value,
    },
  });
}, 500);

const openDevTool = () => {
  ipcRenderer.send('msg-trigger', { type: 'openPluginDevTools' });
};

const pinWindow = () => {
  console.log('pin');
  const { pin } = pluginInfo.value;
  if (pin) {
    ipcRenderer.send('detach:service', { type: 'unpin' });
  } else {
    ipcRenderer.send('detach:service', { type: 'pin' });
  }
  pluginInfo.value.pin = !pin;
};

const updateConfig = (updatedConfig) => {
  if (updatedConfig) {
    config.value = updatedConfig;
  }
};

const minimize = () => {
  ipcRenderer.send('detach:service', { type: 'minimize' });
};

const maximize = () => {
  ipcRenderer.send('detach:service', { type: 'maximize' });
};

const close = () => {
  ipcRenderer.send('detach:service', { type: 'close' });
};

Object.assign(window, {
  setSubInputValue: ({ value }) => {
    pluginInfo.value.subInput.value = value;
  },
  setSubInput: (placeholder) => {
    pluginInfo.value.subInput.placeholder = placeholder;
  },
  removeSubInput: () => {
    pluginInfo.value.subInput = null;
  },
});

window.enterFullScreenTrigger = () => {
  document.querySelector('.detach').classList.remove('darwin');
};
window.leaveFullScreenTrigger = () => {
  const titleDom = document.querySelector('.detach');
  if (!titleDom.classList.contains('darwin')) {
    titleDom.classList.add('darwin');
  }
};

window.maximizeTrigger = () => {
  const btnMaximize = document.querySelector('.maximize');
  if (!btnMaximize || btnMaximize.classList.contains('unmaximize')) return;
  btnMaximize.classList.add('unmaximize');
};

window.unmaximizeTrigger = () => {
  const btnMaximize = document.querySelector('.maximize');
  if (!btnMaximize) return;
  btnMaximize.classList.remove('unmaximize');
};

if (process.platform === 'darwin') {
  window.onkeydown = (e) => {
    if (e.code === 'Escape') {
      ipcRenderer.send('detach:service', { type: 'endFullScreen' });
      return;
    }
    if (e.metaKey && (e.code === 'KeyW' || e.code === 'KeyQ')) {
      window.handle.close();
    }
  };
} else {
  window.onkeydown = (e) => {
    if (e.ctrlKey && e.code === 'KeyW') {
      window.handle.close();
      return;
    }
  };
}
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, 'PingFang SC', 'Helvetica Neue', 'Microsoft Yahei', sans-serif;
  user-select: none;
  overflow: hidden;
}

.detach {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  color: var(--color-text-primary);
}

.detach {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 18px;
  padding-left: 10px;
  font-weight: 500;
  box-sizing: border-box;
  justify-content: space-between;
}

.detach.darwin {
  padding-left: 80px;
  -webkit-app-region: drag;
}

.detach.win32 {
  -webkit-app-region: drag;
}

.detach img {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}

.detach input {
  background-color: var(--color-body-bg);
  color: var(--color-text-primary);
  width: 360px;
  height: 36px;
  line-height: 36px;
  border-radius: 4px;
  font-size: 14px;
  border: none;
  padding: 0 10px;
  outline: none;
  -webkit-app-region: no-drag;
}

.detach input::-webkit-input-placeholder {
  color: #aaa;
  user-select: none;
  font-size: 14px;
}

.detach .info {
  display: flex;
  align-items: center;
}
</style>
