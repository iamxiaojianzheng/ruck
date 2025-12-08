<template>
  <div class="list-container">
    <div class="options" v-show="!!(lists || []).length">
      <div
        :key="index"
        :class="currentSelect === index ? 'active op-item' : 'op-item'"
        v-for="(item, index) in lists"
        @click="selectItem(item)"
      >
        <img v-if="item.icon" class="icon" :src="item.icon" />
        <div class="content">
          <div class="title">{{ item.title }}</div>
          <div class="desc">{{ decodeURIComponent(item.description) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue';
const { ipcRenderer } = window.require('electron');

const itemHeight = 60;
const itemMaxNum = 10;
const defaultHeight = 60;

const { code, type, payload } = history.state.params;
const current = window.exports[code];
const { args } = current;
const { enter, search, select } = args;

window.rubick.setExpendHeight(defaultHeight);

const lists = ref([]);
const setList = (result) => {
  lists.value = result;
};

watch([lists], () => {
  const length = lists.value.length;
  const height = length > itemMaxNum ? itemMaxNum * itemHeight : itemHeight * length;
  window.rubick.setExpendHeight(defaultHeight + height);
});

if (enter) {
  enter({ code: code, type, payload }, (result) => {
    lists.value = result;
  });
}

const currentSelect = ref(0);
ipcRenderer.removeAllListeners('changeCurrent');
ipcRenderer.on('changeCurrent', (e, result) => {
  const length = lists.value.length;
  const currentSelectValue = currentSelect.value;
  if (currentSelectValue + result > length - 1 || lists.value + result < 0) {
    return;
  }
  currentSelect.value = currentSelect.value + result;
});

window.rubick.setSubInput(({ text }) => {
  if (search) {
    const action = { code, type: '', payload: [] };
    search(action, text, setList);
  }
}, '搜索');

const selectItem = (item) => {
  select && select({ code, type: '', payload: [] }, item, setList);
};

const onKeydownAction = (e) => {
  const currentSelectValue = currentSelect.value;
  if (e.code === 'Enter') {
    return selectItem(lists.value[currentSelectValue]);
  }

  let index = 0;
  if (e.code === 'ArrowDown') {
    index = 1;
  }

  if (e.code === 'ArrowUp') {
    index = -1;
  }

  const length = lists.value.length;
  if (!length) return;

  if (currentSelectValue + index > length - 1 || currentSelectValue + index < 0) {
    return;
  }

  currentSelect.value = currentSelectValue + index;
};

window.addEventListener('keydown', onKeydownAction);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownAction);
});
</script>

<style lang="less" scoped>
.list-container {
  .options {
    position: absolute;
    left: 0;
    width: 100%;
    z-index: 99;
    max-height: calc(100vh);
    overflow: auto;
  }
  .options::-webkit-scrollbar {
    width: 0;
  }
  .op-item {
    padding: 0 10px;
    height: 60px;
    max-height: 500px;
    overflow: auto;
    background: #fafafa;
    display: flex;
    align-items: center;
    font-size: 14px;
    text-align: left;
  }
  .icon {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    margin-right: 10px;
  }
  .title {
    width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .desc {
    color: #999;
    width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .op-item.active {
    background: #dee2e8;
  }
}
</style>
