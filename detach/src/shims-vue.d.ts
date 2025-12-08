/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  rubick: any;
  detachAPI: DetachAPI;
}

/**
 * Detach 窗口专用 API
 */
interface DetachAPI {
  // 系统操作
  isDev(): Promise<boolean>;
  openDevTools(): Promise<void>;

  // Detach 窗口操作
  getConfig(): Promise<any>;
  updatePluginSetting(pluginName: string, key: string, value: any): Promise<any>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
  pin(): Promise<void>;
  unpin(): Promise<void>;
  endFullScreen(): Promise<void>;
  detachInputChange(text: string): Promise<void>;
}
