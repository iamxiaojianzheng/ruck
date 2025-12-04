import { ref, watch } from 'vue';
import debounce from 'lodash.debounce';
import { ipcRenderer } from 'electron';
import { getGlobal } from '@electron/remote';
import PinyinMatch from 'pinyin-match';
import pluginClickEvent from './pluginClickEvent';
import clipboardWatch from './clipboardWatch';

/**
 * 字符串格式化为正则表达式
 */
function formatReg(regStr: string) {
  const flags = regStr.replace(/.*\/([gimy]*)$/, '$1');
  const pattern = regStr.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
  return new RegExp(pattern, flags);
}

/**
 * 根据搜索值匹配符合规则的CMD
 */
function matchCmds(cmds: Cmd[], value: string, strict = false) {
  return cmds.filter((cmd) => {
    if (typeof cmd === 'string') {
      return !!PinyinMatch.match(cmd, value);
    }
    if (cmd.type === 'regex' && typeof cmd.match === 'string' && !strict) {
      const match: string = cmd.match;
      return formatReg(match).test(value);
    }
    if (cmd.type === 'over' && !strict) {
      return true;
    }
    return false;
  });
}

const optionsManager = ({ searchValue, appList, openPlugin, currentPlugin }) => {
  const optionsRef = ref([]);

  // 全局快捷键
  ipcRenderer.on('global-short-key', (_, msg) => {
    const options = getOptionsFromSearchValue(msg, true);
    options[0].click();
  });

  const getIndex = (cmd, value: string) => {
    let index = 0;
    if (PinyinMatch.match(cmd.label || cmd, value)) {
      index += 1;
    }
    if (cmd.label) {
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
      type: pluginType,
      match: PinyinMatch.match(cmdLabel, payload),
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
   * 从搜索值中获取插件选项
   */
  const getOptionsFromSearchValue = (value: string, strict = false) => {
    const localPlugins = getGlobal('LOCAL_PLUGINS').getLocalPlugins();
    let options: Option[] = [];

    // 先搜索 plugin
    localPlugins.forEach((plugin) => {
      const features = plugin.features;
      if (!features) return;

      for (const feature of features) {
        const cmds = matchCmds(feature.cmds, value, strict);
        for (const cmd of cmds) {
          const option = buildPluginOption(plugin, feature, cmd, value, openPlugin);
          options.push(option);
        }
      }
    });

    // 再搜索 app
    const appPlugins = appList.value || [];
    const descMap = new Map();
    options = [
      ...options,
      ...appPlugins
        .filter((plugin) => {
          if (!descMap.get(plugin)) {
            descMap.set(plugin, true);
            let has = false;
            plugin.keyWords.some((keyword) => {
              const match = PinyinMatch.match(keyword, value);
              if (match) {
                has = keyword;
                plugin.name = keyword;
                plugin.match = match;
                return true;
              }
              return false;
            });
            return has;
          } else {
            return false;
          }
        })
        .map((plugin) => {
          const option = {
            ...plugin,
            zIndex: 0,
            click: () => {
              openPlugin(plugin, option);
            },
          };
          return option;
        }),
    ];
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
      trailing: false, // 延迟结束时不执行
    }
  );

  const setOptionsRef = (options) => {
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
