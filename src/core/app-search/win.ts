import fs from 'fs';
import path from 'path';
import os from 'os';
import { shell } from 'electron';

const filePath = path.resolve('C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs');

const appData = path.join(os.homedir(), './AppData/Roaming');

const startMenu = path.join(appData, 'Microsoft\\Windows\\Start Menu\\Programs');

const splitNameRegex = /[ _-]/;

const iconDir = path.join(os.tmpdir(), 'ProcessIcon');
const exists = fs.existsSync(iconDir);
if (!exists) {
  fs.mkdirSync(iconDir);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fileIcon = require('extract-file-icon');

const getico = (iconPath: string, originFile: string, target: string) => {
  try {
    const buffer = fileIcon(originFile, 32) || fileIcon(target, 32);
    if (buffer) {
      fs.writeFile(iconPath, buffer, 'base64', () => {
        return;
      });
    }
  } catch (e) {
    console.log(e, target);
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

        const isFile = stats.isFile(); // 是文件
        if (isFile) {
          const appName = fileName.split('.')[0];
          const keyWords = [appName];
          let appDetail: any = {};
          try {
            appDetail = shell.readShortcutLink(fullPath);
            // console.log(appDetail);
          } catch (e) {
            //
          }

          if (!appDetail.target) continue;

          // C:/program/cmd.exe => cmd
          keyWords.push(fileName);

          if (splitNameRegex.test(appName)) {
            keyWords.push(...appName.split(splitNameRegex));
          }

          // const icon = path.join(iconDir, `${encodeURIComponent(appName)}.png`);
          const icon = path.join(iconDir, `${appName}.png`);

          const { target, args } = appDetail;
          const appInfo = {
            value: 'plugin',
            desc: appDetail.target,
            type: 'app',
            icon,
            pluginType: 'app',
            action: `start "dummyclient" "${target}" ${args}`,
            keyWords: keyWords,
            name: appName,
            names: JSON.parse(JSON.stringify(keyWords)),
          };
          fileLists.push(appInfo);
          getico(icon, fullPath, appDetail.target);
        }
      } catch (eror) {
        console.warn('获取文件stats失败', eror);
      }
    }
  } catch (err) {
    console.warn(err);
  }
}

export default async () => {
  const fileLists: any[] = [];
  await Promise.all([
    fileDisplay(filePath, fileLists),
    fileDisplay(startMenu, fileLists)
  ]);
  return fileLists;
};
