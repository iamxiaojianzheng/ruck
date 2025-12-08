import { ref, watch, type Ref } from 'vue';
import debounce from 'lodash.debounce';
import { ipcRenderer } from 'electron';
import type { Cmd, Feature, PluginOption as Option, RuntimePlugin } from '@/types';
import pluginClickEvent from './pluginClickEvent';
import clipboardWatch from './clipboardWatch';
import { cachedPinyinMatch } from './cache';
import { getPluginIndex, type PluginIndexItem } from './search/plugin-index';

/**
 * 字符串格式化为正则表达式
 */
function formatReg(regStr: string) {
  const flags = regStr.replace(/.*\/([gimy]*)$/, '$1');
  const pattern = regStr.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
  return new RegExp(pattern, flags);
}

interface OptionsManagerParams {
  searchValue: Ref<string>;
  appList: Ref<any[]>;
  openPlugin: (plugin: any, option?: Option) => void;
  currentPlugin: Ref<Partial<RuntimePlugin>>;
}

const optionsManager = ({ searchValue, appList, openPlugin, currentPlugin }: OptionsManagerParams) => {
  const optionsRef = ref([]);

  // 全局快捷键
  ipcRenderer.on('global-short-key', (_, msg) => {
    const options = getOptionsFromSearchValue(msg, true);
    if (options.length > 0) {
      options[0].click();
    }
  });

  const getIndex = (cmd: Cmd | string, value: string): number => {
    let index = 0;
    const label = typeof cmd === 'string' ? cmd : cmd.label;
    if (cachedPinyinMatch(label, value)) {
      index += 1;
    }
    if (typeof cmd !== 'string' && cmd.label) {
      index -= 1;
    }
    return index;
  };

  /**
   * 构建插件操作选项
   */
  const buildPluginOption = (plugin, feature: Feature, cmd: Cmd | string, payload: string, openPlugin): Option => {
    const { logo: pluginLogo, logoPath, pluginType } = plugin;
    const { code: featureCode, explain: featureExplain } = feature;
    let cmdLabel: string, cmdType: string;
    if (typeof cmd === 'string') {
      cmdLabel = cmd;
    } else {
      cmdLabel = cmd.label;
      cmdType = cmd.type;
    }

    const option: Option = {
      name: cmdLabel,
      value: 'plugin',
      icon: logoPath || pluginLogo,
      desc: featureExplain,
      pluginType: pluginType,
      match: cachedPinyinMatch(cmdLabel, payload),
      zIndex: getIndex(cmd, payload), // 排序权重
      click: () => {
        let ext = null;
        if (cmdType) {
          ext = {
            code: featureCode,
            type: cmdType || 'text',
            payload: searchValue.value,
          };
        }
        pluginClickEvent({ plugin, fe: feature, cmd, ext, openPlugin, option });
      },
    };
    return option;
  };

  /**
   * 搜索插件命令
   */
  const searchPluginCmds = (value: string, strict: boolean): Option[] => {
    const index = getPluginIndex();
    return index
      .filter((item: PluginIndexItem) => {
        // 字符串命令：拼音匹配
        if (typeof item.cmd === 'string') {
          return cachedPinyinMatch(item.cmdLabel, value);
        }

        // 正则匹配
        if (item.cmd.type === 'regex' && typeof item.cmd.match === 'string' && !strict) {
          const match: string = item.cmd.match;
          return formatReg(match).test(value);
        }

        // over 类型（总是匹配）
        if (item.cmd.type === 'over' && !strict) {
          return true;
        }

        return false;
      })
      .map((item: PluginIndexItem) => {
        return buildPluginOption(item.plugin, item.feature, item.cmd, value, openPlugin);
      });
  };

  /**
   * 搜索应用
   */
  const searchApps = (value: string): Option[] => {
    const appPlugins = appList.value || [];
    const pluginMatchMap = new Map();

    return appPlugins
      .filter((plugin) => {
        if (!pluginMatchMap.has(plugin)) {
          let matchResult: number[][] | false = false;

          for (const keyword of plugin.keyWords) {
            const match = cachedPinyinMatch(keyword, value);
            if (match) {
              matchResult = match;
              break;
            }
          }

          if (matchResult) {
            pluginMatchMap.set(plugin, matchResult);
            return true;
          }
        }
        return false;
      })
      .map((plugin) => {
        const match = pluginMatchMap.get(plugin);
        return {
          name: plugin.name,
          value: plugin.value || 'app',
          pluginType: 'app' as const,
          icon: plugin.icon,
          desc: plugin.desc,
          match: match,
          zIndex: 0, // 应用默认权重
          click: () => {
            openPlugin(plugin);
          },
        };
      });
  };

  /**
   * 从搜索值中获取插件选项（使用索引优化）
   */
  const getOptionsFromSearchValue = (value: string, strict = false) => {
    // 搜索插件命令
    const pluginOptions = searchPluginCmds(value, strict);

    // 搜索应用
    const appOptions = searchApps(value);

    // 合并结果
    const options = pluginOptions.concat(appOptions);

    // 排序
    options.sort((a, b) => {
      return (b.zIndex || 0) - (a.zIndex || 0);
    });

    return options;
  };

  watch(searchValue, () => search(searchValue.value));

  // search Input operation
  const search = debounce(
    (value) => {
      if (currentPlugin.value.name) return;
      if (clipboardFile.value.length) return;
      if (!value) {
        optionsRef.value = [];
        return;
      }
      optionsRef.value = getOptionsFromSearchValue(value);
    },
    100,
    {
      leading: true, // 立即执行
      trailing: true, // 延迟结束时执行
    }
  );

  const setOptionsRef = (options: Option[]) => {
    optionsRef.value = options;
  };

  const { searchFocus, clipboardFile, clearClipboardFile, readClipboardContent } = clipboardWatch({
    currentPlugin,
    optionsRef,
    openPlugin,
    setOptionsRef,
  });

  return {
    setOptionsRef,
    options: optionsRef,
    searchFocus,
    clipboardFile,
    clearClipboardFile,
    readClipboardContent,
  };
};

export default optionsManager;
