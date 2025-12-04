import { PLUGIN_INSTALL_ROOT_DIR } from '@/common/constants/main';
import commonConst from '@/common/utils/commonConst';
import path from 'path';
import fs from 'fs';

function getTplIndex(): string {
  return commonConst.dev() ? 'http://localhost:8083/#/' : `file://${__static}/tpl/index.html`;
}

function getFeatureIndex(): string {
  return commonConst.dev() ? 'http://localhost:8081/#/' : `file://${__static}/feature/index.html`;
}

function getPluginIndexByEnv(pluginInfo: any, pluginPath: string) {
  if (commonConst.dev()) {
    return 'http://localhost:8081/#/';
  }
  const { name, main } = pluginInfo;
  if (pluginPath && !fs.existsSync(pluginPath)) {
    pluginPath = path.resolve(PLUGIN_INSTALL_ROOT_DIR, name);
  }
  return `file://${path.join(pluginPath, '../', main)}`;
}

function getPluginIndex(pluginInfo: any, pluginPath: string): string {
  const { name, main } = pluginInfo;
  if (pluginPath && !fs.existsSync(pluginPath)) {
    pluginPath = path.resolve(PLUGIN_INSTALL_ROOT_DIR, name);
  }
  return `file://${path.join(pluginPath, './', main || '')}`;
}

export default { getTplIndex, getFeatureIndex, getPluginIndexByEnv, getPluginIndex };
