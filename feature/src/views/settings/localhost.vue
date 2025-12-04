<template>
  <div>
    <a-alert :message="$t('feature.settings.intranet.tips')" type="warning" style="margin-bottom: 20px" />
    <a-form ref="formRef" name="custom-validation" :model="formState" :rules="rules" v-bind="layout">
      <a-form-item has-feedback :label="$t('feature.settings.intranet.npmMirror')" name="register">
        <a-input v-model:value="formState.register" placeholder="https://registry.npmmirror.com" />
      </a-form-item>
      <a-form-item has-feedback :label="$t('feature.settings.intranet.dbUrl')" name="database">
        <a-input v-model:value="formState.database" placeholder="https://ruck.host/" />
      </a-form-item>
      <a-form-item has-feedback :label="$t('feature.settings.intranet.accessToken')" name="access_token">
        <a-input v-model:value="formState.access_token" :placeholder="$t('feature.settings.intranet.placeholder')" />
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 18, offset: 6 }">
        <a-button type="primary" @click="submit">确定</a-button>
        <a-button style="margin-left: 10px" @click="resetForm">恢复默认</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { ref, toRaw } from 'vue';
import { message } from 'ant-design-vue';

let _rev: any;

let defaultConfig = {
  register: 'https://registry.npmmirror.com',
  database: 'https://ruck.host/',
  access_token: '',
};

try {
  const dbdata = window.rubick.db.get('rubick-localhost-config');
  defaultConfig = dbdata.data;
  _rev = dbdata._rev;
} catch (e) {
  // ignore
}

const formState = ref(JSON.parse(JSON.stringify(defaultConfig)));

const rules = {
  register: [{ required: true, trigger: 'change' }],
  database: [{ required: true, trigger: 'change' }],
};
const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

const resetForm = () => {
  formState.value = {
    register: 'https://registry.npmmirror.com',
    database: 'https://ruck.host/',
    access_token: '',
  };
};

const submit = () => {
  const changeData: any = {
    _id: 'rubick-localhost-config',
    data: toRaw(formState.value),
  };

  if (_rev) {
    changeData._rev = _rev;
  }

  window.rubick.db.put(changeData);
  message.success('设置成功！重启插件市场后生效！');
};
</script>

<style lang="less" scoped>
.ant-form {
  :deep(.ant-form-item) {
    label {
      color: var(--color-text-content);
    }
  }
}
:deep(.ant-input) {
  background: var(--color-input-hover);
  color: var(--color-text-content);
}
</style>
