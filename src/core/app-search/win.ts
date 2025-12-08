import fs from 'fs';
import path from 'path';
import os from 'os';
import { shell } from 'electron';
import { generateAbbreviations } from '@/common/utils/abbreviation';
import { pluginLogger as logger } from '@/common/logger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const winVersionInfo = require('win-version-info');

const splitNameRegex = /[ _-]/;
const appData = path.join(os.homedir(), './AppData/Roaming');
const searchPaths = [
  path.resolve('C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'),
  path.join(appData, 'Microsoft\\Windows\\Start Menu\\Programs'),
];

const iconDir = path.join(os.tmpdir(), 'ProcessIcon');
const exists = fs.existsSync(iconDir);
if (!exists) {
  fs.mkdirSync(iconDir);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fileIcon = require('extract-file-icon');

const getico = (iconPath: string, originFile: string, target: string) => {
  try {
    const buffer = fileIcon(target, 32) || fileIcon(originFile, 32);
    if (buffer) {
      fs.writeFile(iconPath, buffer, 'base64', () => {
        return;
      });
    }
  } catch (e) {
    logger.error('提取图标失败', { error: e, target });
  }
};

async function fileDisplay(filePath: string, fileLists: any[]) {
  //根据文件路径读取文件，返回文件列表
  try {
    const fileNames = await fs.promises.readdir(filePath);
    for (const fileName of fileNames) {
      const fullPath = path.join(filePath, fileName);
      try {
        const stats = await fs.promises.stat(fullPath);
        const isDir = stats.isDirectory(); // 是文件夹
        if (isDir) {
          await fileDisplay(fullPath, fileLists); // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }

        if (stats.isFile()) {
          const fileBaseName = fileName.split('.')[0];
          let appDetail: any = {};
          try {
            appDetail = shell.readShortcutLink(fullPath);
          } catch (e) {
            // 无法读取快捷方式
          }

          if (!appDetail.target) continue;

          // 尝试从目标可执行文件获取本地化显示名称
          let displayName = fileBaseName;
          if (appDetail.target && appDetail.target.toLowerCase().endsWith('.exe')) {
            try {
              const versionInfo = winVersionInfo(appDetail.target);
              // 优先使用 FileDescription（通常包含本地化名称）
              if (versionInfo?.FileDescription) {
                displayName = versionInfo.FileDescription.trim();
              } else if (versionInfo?.ProductName) {
                displayName = versionInfo.ProductName.trim();
              }
            } catch (e) {
              // 无法读取版本信息，使用默认文件名
            }
          }

          // 构建搜索关键词列表
          const keyWords = [displayName];

          // 如果本地化名称与文件名不同，添加英文文件名作为关键词
          if (fileBaseName !== displayName) {
            keyWords.push(fileBaseName);
          }

          // 添加完整文件名
          keyWords.push(fileName);

          // 如果文件名包含分隔符，拆分后添加
          if (splitNameRegex.test(fileBaseName)) {
            keyWords.push(...fileBaseName.split(splitNameRegex));
          }

          // 添加应用名缩写（支持 vsc → Visual Studio Code 等）
          const abbreviations = generateAbbreviations(displayName);
          keyWords.push(...abbreviations);

          // 如果本地化名称与文件名不同，也为文件名生成缩写
          if (fileBaseName !== displayName) {
            const fileAbbreviations = generateAbbreviations(fileBaseName);
            keyWords.push(...fileAbbreviations);
          }

          const icon = path.join(iconDir, `${fileBaseName}.png`);

          const { target, args } = appDetail;
          const appInfo = {
            value: 'plugin',
            desc: appDetail.target,
            type: 'app',
            icon,
            pluginType: 'app',
            action: `start "dummyclient" "${target}" ${args}`,
            keyWords: keyWords,
            name: displayName,
            names: JSON.parse(JSON.stringify(keyWords)),
          };
          fileLists.push(appInfo);
          getico(icon, fullPath, appDetail.target);
        }
      } catch (eror) {
        logger.warn('获取文件stats失败', { error: eror });
      }
    }
  } catch (err) {
    logger.warn('读取目录失败', { error: err });
  }
}

export default async () => {
  const fileLists: any[] = [];
  const taskList = searchPaths.map((item) => fileDisplay(item, fileLists));
  await Promise.all(taskList);
  return fileLists;
};
