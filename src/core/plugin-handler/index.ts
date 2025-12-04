import { AdapterHandlerOptions, AdapterInfo } from '@/core/plugin-handler/types';
import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import fixPath from 'fix-path';
import spawn from 'cross-spawn';
import { ipcRenderer } from 'electron';
import axios from 'axios';

fixPath();

/**
 * 系统插件管理器
 * @class AdapterHandler
 */
class AdapterHandler {
  // 插件安装地址
  public baseDir: string;
  // 插件源地址
  readonly registry: string;

  // 插件缓存，用于存储最新版本信息
  pluginCaches: Record<string, string> = {};

  /**
   * 创建 AdapterHandler 实例
   * @param {AdapterHandlerOptions} options
   * @memberof AdapterHandler
   */
  constructor(options: AdapterHandlerOptions) {
    // 初始化插件存放目录
    if (!fs.existsSync(options.baseDir)) {
      fs.mkdirsSync(options.baseDir);
      fs.writeFileSync(
        `${options.baseDir}/package.json`,
        // 修复插件安装时的 node 版本问题
        JSON.stringify({
          dependencies: {},
          volta: {
            node: '16.19.1',
          },
        })
      );
    }
    this.baseDir = options.baseDir;

    let register = options.registry || 'https://registry.npmmirror.com';

    try {
      if (ipcRenderer) {
        const dbdata = ipcRenderer.sendSync('msg-trigger', {
          type: 'dbGet',
          data: { id: 'rubick-localhost-config' },
        });
        if (dbdata && dbdata.data && dbdata.data.register) {
          register = dbdata.data.register;
        }
      }
    } catch (e) {
      // 忽略错误，使用默认源
      console.error('获取数据库配置失败:', e);
    }
    this.registry = register || 'https://registry.npmmirror.com/';
  }

  /**
   * 升级指定插件
   * @param name 插件名称
   */
  async upgrade(name: string): Promise<void> {
    try {
      const packageJSONPath = path.join(this.baseDir, 'package.json');
      const packageJSON = await fs.readJson(packageJSONPath);

      if (!packageJSON.dependencies || !packageJSON.dependencies[name]) {
        return;
      }

      const registryUrl = `${this.registry}${name}`;

      // 获取当前安装的版本
      const installedVersion = packageJSON.dependencies[name].replace('^', '');
      let latestVersion = this.pluginCaches[name];

      // 如果没有缓存，则从远程获取最新版本
      if (!latestVersion) {
        const { data } = await axios.get(registryUrl, { timeout: 2000 });
        latestVersion = data['dist-tags'].latest;
        this.pluginCaches[name] = latestVersion;
      }

      // 如果有新版本，则进行更新
      if (latestVersion && latestVersion > installedVersion) {
        await this.install([name], { isDev: false });
      }
    } catch (e) {
      console.error(`升级插件 ${name} 失败:`, e);
    }
  }

  /**
   * 获取插件信息
   * @param {string} adapter 插件名称
   * @param {string} adapterPath 插件指定路径
   * @memberof PluginHandler
   */
  async getAdapterInfo(adapter: string, adapterPath: string): Promise<AdapterInfo> {
    let adapterInfo: AdapterInfo;
    const infoPath = adapterPath || path.resolve(this.baseDir, 'node_modules', adapter, 'plugin.json');

    // 从本地获取
    if (await fs.pathExists(infoPath)) {
      adapterInfo = (await fs.readJson(infoPath)) as AdapterInfo;
    } else {
      // 本地没有从远程获取
      // TODO: 增加更完善的错误处理和重试机制
      const resp = await got.get(`https://cdn.jsdelivr.net/npm/${adapter}/plugin.json`);
      adapterInfo = JSON.parse(resp.body) as AdapterInfo;
    }
    return adapterInfo;
  }

  /**
   * 安装并启动插件
   * @param adapters 插件名称列表
   * @param options 选项
   */
  async install(adapters: Array<string>, options: { isDev: boolean }) {
    const installCmd = options.isDev ? 'link' : 'install';
    await this.execCommand(installCmd, adapters);
  }

  /**
   * 更新指定插件
   * @param {...string[]} adapters 插件名称
   * @memberof AdapterHandler
   */
  async update(...adapters: string[]) {
    await this.execCommand('update', adapters);
  }

  /**
   * 卸载指定插件
   * @param {string[]} adapters 插件名称列表
   * @param options 选项
   * @memberof AdapterHandler
   */
  async uninstall(adapters: string[], options: { isDev: boolean }) {
    const installCmd = options.isDev ? 'unlink' : 'uninstall';
    await this.execCommand(installCmd, adapters);
  }

  /**
   * 列出所有已安装插件
   * @memberof AdapterHandler
   */
  async list(): Promise<string[]> {
    try {
      const packageJSONPath = path.join(this.baseDir, 'package.json');
      const installInfo = await fs.readJson(packageJSONPath);
      const adapters: string[] = [];
      if (installInfo.dependencies) {
        for (const adapter in installInfo.dependencies) {
          adapters.push(adapter);
        }
      }
      return adapters;
    } catch (e) {
      console.error('获取已安装插件列表失败:', e);
      return [];
    }
  }

  /**
   * 运行包管理器命令
   * @param cmd 命令 (install, uninstall, update, link, unlink)
   * @param modules 模块名称列表
   * @memberof AdapterHandler
   */
  private async execCommand(cmd: string, modules: string[]): Promise<{ code: number; data: string }> {
    return new Promise((resolve, reject) => {
      let args: string[] = [cmd];

      // 如果不是卸载或链接，则安装 latest 版本
      if (cmd !== 'uninstall' && cmd !== 'link' && cmd !== 'unlink') {
        args = args.concat(modules.map((m) => `${m}@latest`));
      } else {
        args = args.concat(modules);
      }

      if (cmd !== 'link' && cmd !== 'unlink') {
        args = args.concat('--color=always').concat('--save').concat(`--registry=${this.registry}`);
      }

      const npm = spawn('npm', args, {
        cwd: this.baseDir,
      });

      // console.log('执行 npm 命令:', args.join(' '));

      let output = '';
      npm.stdout?.on('data', (data: string) => {
        output += data;
        // 可以考虑通过 IPC 发送进度给渲染进程
      });

      npm.stderr?.on('data', (data: string) => {
        output += data;
      });

      npm.on('close', (code: number) => {
        if (code === 0) {
          resolve({ code: 0, data: output });
        } else {
          reject({ code: code, data: output });
        }
      });

      npm.on('error', (err) => {
        reject({ code: -1, data: err.message });
      });
    });
  }
}

export default AdapterHandler;
