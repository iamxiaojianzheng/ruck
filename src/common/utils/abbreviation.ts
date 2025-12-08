/**
 * 应用名称缩写生成工具
 *
 * 为英文应用名生成首字母缩写，方便快速搜索。
 * 中文应用的拼音缩写由 pinyin-match 库自动支持。
 *
 * @module abbreviation
 */

/**
 * 生成应用名称的缩写
 *
 * @param appName 应用名称
 * @returns 缩写数组
 *
 * @example
 * generateAbbreviations('Visual Studio Code') // ['vsc']
 * generateAbbreviations('Microsoft Edge')     // ['me']
 * generateAbbreviations('WeChat')             // ['wc']
 * generateAbbreviations('微信')                // [] (中文由 pinyin-match 处理)
 */
export function generateAbbreviations(appName: string): string[] {
  const abbrs: string[] = [];

  // 1. 英文多词缩写 (Visual Studio Code → vsc)
  if (/^[a-zA-Z\s]+$/.test(appName)) {
    const words = appName.split(/\s+/).filter((w) => w.length > 0);
    if (words.length >= 2) {
      const wordAbbr = words.map((w) => w[0].toLowerCase()).join('');
      if (wordAbbr.length >= 2 && wordAbbr.length <= 10) {
        abbrs.push(wordAbbr);
      }
    }
  }

  // 2. 驼峰命名缩写 (WeChat → wc, QQMusic → qqm)
  const camelMatches = appName.match(/[A-Z][a-z]*/g);
  if (camelMatches && camelMatches.length >= 2) {
    const camelAbbr = camelMatches.map((w) => w[0].toLowerCase()).join('');
    if (camelAbbr.length >= 2 && camelAbbr.length <= 10) {
      abbrs.push(camelAbbr);
    }
  }

  // 3. 连续大写字母 (VSCode → vscode)
  const upperMatches = appName.match(/[A-Z]{2,}/g);
  if (upperMatches) {
    for (const match of upperMatches) {
      if (match.length >= 2 && match.length <= 10) {
        abbrs.push(match.toLowerCase());
      }
    }
  }

  // 去重
  return [...new Set(abbrs)];
}

/**
 * 英文首字母缩写匹配
 *
 * 匹配英文应用名的首字母缩写，并返回每个首字母的精确位置。
 *
 * @param text 原始文本（如 "Visual Studio Code"）
 * @param abbr 缩写（如 "vsc"）
 * @returns 匹配位置数组 [[0, 0], [7, 7], [14, 14]] 或 false
 *
 * @example
 * matchEnglishAbbreviation('Visual Studio Code', 'vsc')
 * // 返回: [[0, 0], [7, 7], [14, 14]]
 * // 表示: V 在位置 0, S 在位置 7, C 在位置 14
 */
export function matchEnglishAbbreviation(text: string, abbr: string): number[][] | false {
  // 仅处理英文字符串
  if (!/^[a-zA-Z\s]+$/.test(text) || !abbr) {
    return false;
  }

  const abbrLower = abbr.toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  // 方案1: 匹配空格分隔的单词首字母
  if (words.length >= 2 && words.length === abbrLower.length) {
    const positions: number[][] = [];
    let currentPos = 0;
    let allMatch = true;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const expectedChar = abbrLower[i];

      // 在原文中找到当前单词的位置
      const wordIndex = text.indexOf(word, currentPos);

      if (wordIndex === -1 || word[0].toLowerCase() !== expectedChar) {
        allMatch = false;
        break;
      }

      // 记录首字母的位置
      positions.push([wordIndex, wordIndex]);
      currentPos = wordIndex + word.length;
    }

    if (allMatch) {
      return positions;
    }
  }

  // 方案2: 匹配驼峰命名 (WeChat → wc)
  const camelMatches = text.match(/[A-Z][a-z]*/g);
  if (camelMatches && camelMatches.length >= 2 && camelMatches.length === abbrLower.length) {
    const positions: number[][] = [];
    let allMatch = true;

    for (let i = 0; i < camelMatches.length; i++) {
      const part = camelMatches[i];
      const expectedChar = abbrLower[i];

      if (part[0].toLowerCase() !== expectedChar) {
        allMatch = false;
        break;
      }

      // 在原文中找到当前部分的位置
      const regex = new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const match = regex.exec(text);
      if (match) {
        positions.push([match.index, match.index]);
      } else {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      return positions;
    }
  }

  return false;
}
