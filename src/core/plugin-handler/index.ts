/**
 * 插件处理器模块
 * 
 * 本模块提供了 Ruck 插件系统的核心功能，负责插件的全生命周期管理：
 * - 插件安装（本地开发模式和远程安装）
 * - 插件卸载
 * - 插件更新
 * - 插件升级检查
 * - 插件信息获取
 * 
 * **核心特性**：
 * 1. **任务队列**：使用 TaskQueue 确保插件操作的串行执行，避免并发冲突
 * 2. **版本缓存**：缓存插件的最新版本信息，减少网络请求
 * 3. **重试机制**：npm 命令执行失败时自动重试（最多 3 次）
 * 4. **Registry 支持**：支持自定义 npm registry，便于内网部署
 * 
 * **插件管理原理**：
 * Ruck 的插件系统基于 npm 包模式，插件本质上就是 npm 包，带有特殊的 `plugin.json` 配置文件。
 * 通过操作 npm 命令来管理插件的安装、卸载和更新，简单而强大。
 * 
 * @module PluginHandler
 */

import { AdapterHandlerOptions, AdapterInfo } from '@/core/plugin-handler/types';
import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import fixPath from 'fix-path';
import spawn from 'cross-spawn';
import axios from 'axios';

fixPath();

/**
 * 任务队列类
 * 
 * 用于串行执行异步任务，确保插件操作不会发生并发冲突。
 * 例如：防止同时安装多个插件导致 npm 锁文件冲突。
 * 
 * @class TaskQueue
 */
class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  /**
   * 添加任务到队列
   * @param task 异步任务函数
   */
  add(task: () => Promise<void>) {
    this.queue.push(task);
    this.run();
  }

  /**
   * 执行队列中的任务
   * 
   * 如果队列正在运行，直接返回。
   * 否则，依次执行队列中的所有任务。
   */
  private async run() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (e) {
          console.error('任务执行失败:', e);
        }
      }
    }
    this.running = false;
  }
}

/**
 * 插件处理器类
 * 
 * 负责管理所有插件的安装、卸载、更新等操作。
 * 
 * **工作流程**：
 * 1. 初始化时创建插件存放目录和 package.json
 * 2. 使用 npm 命令进行插件操作
 * 3. 通过任务队列确保操作的串行执行
 * 4. 支持版本检查和自动升级
 * 
 * **插件存储结构**：
 * ```
 * baseDir/
 * ├── package.json
 * └── node_modules/
 *     ├── plugin-name-1/
 *     │   ├── plugin.json
 *     │   └── index.js
 *     └── plugin-name-2/
 *         ├── plugin.json
 *         └── index.js
 * ```
 * 
 * @class AdapterHandler
 */
class AdapterHandler {
  // 插件安装地址
  public baseDir: string;
  // 插件源地址
  readonly registry: string;

  // 插件缓存，用于存储最新版本信息
  pluginCaches: Record<string, string> = {};

  // 任务队列实例
  private taskQueue = new TaskQueue();

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

    const defaultRegistry = 'https://registry.npmmirror.com';
    const register = options.registry || defaultRegistry;

    // 确保 registry 始终以斜杠结尾，避免 URL 拼接错误
    this.registry = register.endsWith('/') ? register : register + '/';
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

      // registry 已确保以斜杠结尾，直接拼接即可
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
   * 安装并启动插件（公开方法，加入队列）
   * @param adapters 插件名称列表
   * @param options 选项
   */
  async install(adapters: Array<string>, options: { isDev: boolean }) {
    return new Promise<void>((resolve, reject) => {
      this.taskQueue.add(async () => {
        try {
          await this._install(adapters, options);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * 内部安装方法
   */
  private async _install(adapters: Array<string>, options: { isDev: boolean }) {
    const installCmd = options.isDev ? 'link' : 'install';
    await this.execCommand(installCmd, adapters);
  }

  /**
   * 更新指定插件
   * @param {...string[]} adapters 插件名称
   * @memberof AdapterHandler
   */
  async update(...adapters: string[]) {
    this.taskQueue.add(async () => {
      await this.execCommand('update', adapters);
    });
  }

  /**
   * 卸载指定插件
   * @param {string[]} adapters 插件名称列表
   * @param options 选项
   * @memberof AdapterHandler
   */
  async uninstall(adapters: string[], options: { isDev: boolean }) {
    this.taskQueue.add(async () => {
      const installCmd = options.isDev ? 'unlink' : 'uninstall';
      await this.execCommand(installCmd, adapters);
    });
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
   * @param retryCount 重试次数
   * @memberof AdapterHandler
   */
  private async execCommand(cmd: string, modules: string[], retryCount = 3): Promise<{ code: number; data: string }> {
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

      npm.on('close', async (code: number) => {
        if (code === 0) {
          resolve({ code: 0, data: output });
        } else {
          // 失败重试逻辑
          if (retryCount > 0) {
            console.log(`命令执行失败，正在重试 (剩余次数: ${retryCount})...`);
            try {
              const result = await this.execCommand(cmd, modules, retryCount - 1);
              resolve(result);
            } catch (e) {
              reject(e);
            }
          } else {
            reject({ code: code, data: output });
          }
        }
      });

      npm.on('error', (err) => {
        reject({ code: -1, data: err.message });
      });
    });
  }
}

export default AdapterHandler;
