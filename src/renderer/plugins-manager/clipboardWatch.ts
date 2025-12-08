import path from 'path';
import { ref } from 'vue';
import { getGlobal } from '@electron/remote';
import { clipboard, nativeImage, ipcRenderer } from 'electron';

import localConfig from '../confOp';
import pluginClickEvent from './pluginClickEvent';
import getCopyFiles from '@/common/utils/getCopyFiles';
import { rendererLogger as logger } from '@/common/logger';

export default ({ currentPlugin, optionsRef, openPlugin, setOptionsRef }) => {
  const clipboardFile: any = ref([]);

  /**
   * 字符串格式化为正则表达式
   */
  const formatReg = (regStr: string) => {
    const flags = regStr.replace(/.*\/([gimy]*)$/, '$1');
    const pattern = regStr.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
    return new RegExp(pattern, flags);
  };

  /**
   * 构建复制路径的选项
   */
  const buildCopyPathOption = (fileList) => {
    return {
      name: '复制路径',
      value: 'plugin',
      icon: require('../assets/link.png'),
      desc: '复制路径到剪切板',
      click: () => {
        clipboard.writeText(fileList.map((file) => file.path).join(','));
        window.ruckAPI.hideMainWindow();
      },
    };
  };

  /**
   * 构建插件操作选项
   */
  const buildPluginOption = (plugin, feature, cmd, payload, openPlugin) => {
    const { logo: pluginLogo, pluginType } = plugin;
    const { code: featureCode, explain: featureExplain } = feature;
    const { label: cmdLabel, type: cmdType } = cmd;
    const option = {
      name: cmdLabel,
      value: 'plugin',
      icon: pluginLogo,
      desc: featureExplain,
      type: pluginType,
      click: () => {
        const ext = {
          code: featureCode,
          type: cmdType || 'text',
          payload,
        };
        pluginClickEvent({ plugin, fe: feature, cmd, ext, openPlugin, option });
        clearClipboardFile();
      },
    };
    return option;
  };

  const matchFiles = (fileList: Array<FileInfo>, cmd: Cmd): boolean => {
    const { match, fileType } = cmd;
    return fileList.every((file) => {
      if (file.isDirectory && fileType === 'directory') return true;
      else if (file.isFile && fileType === 'file') {
        if (typeof match === 'string' && formatReg(match as string).test(path.extname(file.name))) {
          return true;
        }
      }
      return false;
    });
  };

  /**
   * 根据粘贴板中的文件或文本内容生成插件操作选项。
   * files - 文件列表，如果没有提供，将通过 `getCopyFiles()` 获取文件。
   * strict - 是否开启严格模式，如果开启且未开启自动粘贴，则直接返回。
   */
  const handleInputOrCopyFile = (files: Array<FileInfo>, strict = true) => {
    logger.debug('开始处理剪贴板文件');
    const config: any = localConfig.getConfig();

    // 如果未开启自动粘贴且严格模式为 true，则直接返回
    if (!config.perf.common.autoPast && strict) return;

    // 如果当前插件名称已存在，则不执行任何操作
    if (currentPlugin.value.name) return;

    const fileList: Array<FileInfo> = files || getCopyFiles();
    logger.debug('剪贴板文件列表', { count: fileList?.length });

    if (fileList) {
      window.setSubInputValue({ value: '' });
      clipboardFile.value = fileList;

      const options: any = [];

      const localPlugins = getGlobal('LOCAL_PLUGINS').getLocalPlugins();
      for (const plugin of localPlugins) {
        const { features } = plugin;
        if (!features) continue;

        for (const feature of features) {
          console.log(feature);
          for (const cmd of feature.cmds) {
            console.log(cmd);
            if (!Object.keys(cmd).includes('type')) continue;

            const { type: cmdType, match: cmdMatch } = cmd;

            // 图片处理
            if (cmdType === 'img' && fileList.length === 1) {
              const fileExt = path.extname(fileList[0].path);
              if (/\.(png|jpg|gif|jpeg|webp)$/.test(fileExt)) {
                const payload = nativeImage.createFromPath(fileList[0].path).toDataURL();
                const option = buildPluginOption(plugin, feature, cmd, payload, openPlugin);
                options.push(option);
              }
            }

            // 如果是文件，且符合文件正则类型
            if (['file', 'files'].includes(cmdType) && matchFiles(fileList, cmd)) {
              console.log(cmd);
              const payload = fileList;
              const option = buildPluginOption(plugin, feature, cmd, payload, openPlugin);
              console.log(option);
              options.push(option);
            }

            // TODO: handle type is window
            if (cmdType === 'window') {
              // pass
            }
          }
        }
      }

      if (options.length === 0) {
        options.push(buildCopyPathOption(fileList));
      }
      console.log(options);

      setOptionsRef(options);
      clipboard.clear();
      return;
    }

    const clipboardType = clipboard.availableFormats();
    if (!clipboardType.length) return;

    if ('text/plain' === clipboardType[0]) {
      const contentText = clipboard.readText();
      if (contentText.trim()) {
        clearClipboardFile();
        window.setSubInputValue({ value: contentText });
      }
      clipboard.clear();
    }
  };

  const clearClipboardFile = () => {
    clipboardFile.value = [];
    optionsRef.value = [];
  };

  // 触发 ctrl + v 主动粘贴时
  const readClipboardContent = () => {
    // read image
    const img = clipboard.readImage();
    const dataUrl = img.toDataURL();
    if (!dataUrl.replace('data:image/png;base64,', '')) return;

    clipboardFile.value = [
      {
        isFile: true,
        isDirectory: false,
        path: null,
        dataUrl,
      },
    ];

    const localPlugins = getGlobal('LOCAL_PLUGINS').getLocalPlugins();
    const options: any = [];
    // 再正则插件
    localPlugins.forEach((plugin) => {
      const feature = plugin.features;
      // 系统插件无 features 的情况，不需要再搜索
      if (!feature) return;
      feature.forEach((fe) => {
        fe.cmds.forEach((cmd) => {
          if (cmd.type === 'img') {
            const option = {
              name: cmd.label,
              value: 'plugin',
              icon: plugin.logo,
              desc: fe.explain,
              type: plugin.pluginType,
              click: () => {
                pluginClickEvent({
                  plugin,
                  fe,
                  cmd,
                  ext: {
                    code: fe.code,
                    type: cmd.type || 'text',
                    payload: dataUrl,
                  },
                  openPlugin,
                  option,
                });
                clearClipboardFile();
              },
            };
            options.push(option);
          }
        });
      });

      setOptionsRef(options);
    });
  };

  return {
    searchFocus: handleInputOrCopyFile,
    clipboardFile,
    clearClipboardFile,
    readClipboardContent,
  };
};
