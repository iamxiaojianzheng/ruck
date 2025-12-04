import os from 'os';
import path from 'path';
import { uIOhook } from 'uiohook-napi';
import { dialog, Menu, Tray, app, shell, BrowserWindow } from 'electron';

import pkg from '../../../package.json';
import commonConst from '@/common/utils/commonConst';
import localConfig from '@/main/common/initLocalConfig';
import { mainWindowShowAndHide } from './mainWindow';
import { guide } from '../browsers';
import mainInstance from '../index';

let mousedown = false;
let mousedownPoint = { x: 0, y: 0 };
let mouseup = false;
let mouseupPoint = { x: 0, y: 0 };

/**
 * 单击托盘显示或隐藏主窗口
 */
function handleClickTray(window: BrowserWindow, appTray: Tray) {
  appTray.on('click', (e, b, p) => {
    // console.log('tray click', e, b, p);
    if (mousedown && mouseup) {
      if (mouseupPoint.x === mousedownPoint.x && mouseupPoint.y === mousedownPoint.y) {
        const { x: mx, y: my } = mousedownPoint;
        const { width, height, x, y } = b;
        if (x <= mx && mx <= x + width && y <= my && my <= y + height) {
          mainWindowShowAndHide(window);
        }
      }
      mousedown = false;
      mouseup = false;
    }
  });

  uIOhook.on('mouseup', (event) => {
    // console.log('tray hook mouseup');
    const { width, height, x: wx, y: wy } = window.getBounds();
    const { x, y } = event;
    if ((x < wx || x > wx + width) && (y < wy || y > wy + height)) {
      // console.log('subInputBlur');
      // window.blur();
      // window.webContents.executeJavaScript(`window.rubick.subInputBlur()`);
    }
    mouseupPoint = { x, y };
    mouseup = true;
  });

  uIOhook.on('mousedown', (event) => {
    // console.log('tray hook mousedown');
    mousedownPoint = { x: event.x, y: event.y };
    mousedown = true;
  });
}

function createTray(window: BrowserWindow): Promise<Tray> {
  return new Promise((resolve) => {
    let icon;
    if (commonConst.macOS()) {
      icon = './icons/iconTemplate@2x.png';
    } else if (commonConst.windows()) {
      icon = parseInt(os.release()) < 10 ? './icons/icon@2x.png' : './icons/icon.ico';
    } else {
      icon = './icons/icon@2x.png';
    }
    const appTray = new Tray(path.join(__static, icon));

    const openSettings = () => {
      // 检查渲染进程是否就绪
      if (!mainInstance.getRendererReady()) {
        console.log('渲染进程尚未就绪');
        return;
      }
      window.webContents.executeJavaScript(
        `window.rubick && window.rubick.openMenu && window.rubick.openMenu({ code: "settings" })`
      );
      window.show();
    };

    const createContextMenu = () =>
      Menu.buildFromTemplate([
        // {
        //   label: '帮助文档',
        //   click: () => {
        //     process.nextTick(() => {
        //       shell.openExternal('https://github.com/clouDr-f2e/rubick');
        //     });
        //   },
        // },
        {
          label: '引导教学',
          click: () => {
            guide().init();
          },
        },
        {
          label: '意见反馈',
          click: () => {
            process.nextTick(() => {
              shell.openExternal('https://github.com/iamxiaojianzheng/ruck/issues');
            });
          },
        },
        { type: 'separator' },
        {
          label: '显示',
          click() {
            mainWindowShowAndHide(window);
          },
        },
        {
          label: '系统设置',
          click() {
            openSettings();
          },
        },
        { type: 'separator' },
        {
          role: 'quit',
          label: '退出',
        },
        {
          label: '重启',
          click() {
            app.relaunch();
            app.quit();
          },
        },

        { type: 'separator' },
        {
          label: '关于',
          click() {
            dialog.showMessageBox({
              title: 'Ruck',
              message: '只需要用你想要用的（Only use you want）',
              detail: `Version: ${pkg.version}\nAuthor: JIAHE\nGitHub: https://github.com/iamxiaojianzheng/ruck`,
            });
          },
        },
      ]);

    handleClickTray(window, appTray);
    appTray.on('right-click', () => {
      appTray.setContextMenu(createContextMenu());
      appTray.popUpContextMenu();
    });

    appTray.setContextMenu(createContextMenu());

    resolve(appTray);
  });
}

export default createTray;
