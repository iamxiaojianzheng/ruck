import { BrowserWindow, ipcMain, nativeTheme, screen } from 'electron';
import path from 'path';
import commonConst from '../../common/utils/commonConst';
import { GUIDE_CONFIG, WINDOW_CONFIG } from '@/common/constants';

const getWindowPos = (width: number, height: number) => {
  const screenPoint = screen.getCursorScreenPoint();
  const displayPoint = screen.getDisplayNearestPoint(screenPoint);
  return [
    displayPoint.bounds.x + Math.round((displayPoint.bounds.width - width) / 2),
    displayPoint.bounds.y + Math.round((displayPoint.bounds.height - height) / 2),
  ];
};

let win: BrowserWindow | null = null;

export default () => {
  const init = () => {
    if (win) return;
    ipcMain.on('guide:service', async (event, arg: { type: string }) => {
      const data = await operation[arg.type]();
      event.returnValue = data;
    });
    createWindow();
  };

  const createWindow = async () => {
    const [x, y] = getWindowPos(GUIDE_CONFIG.WIDTH, GUIDE_CONFIG.HEIGHT);
    win = new BrowserWindow({
      show: false,
      alwaysOnTop: true,
      resizable: false,
      fullscreenable: false,
      minimizable: false,
      maximizable: false,
      // closable: false,
      skipTaskbar: true,
      autoHideMenuBar: true,
      frame: false,
      enableLargerThanScreen: true,
      x,
      y,
      width: GUIDE_CONFIG.WIDTH,
      height: GUIDE_CONFIG.HEIGHT,
      minHeight: WINDOW_CONFIG.MIN_HEIGHT,
      webPreferences: {
        webSecurity: false,
        backgroundThrottling: false,
        contextIsolation: false,
        webviewTag: true,
        devTools: commonConst.dev(),
        nodeIntegration: true,
        spellcheck: false,
      },
    });
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      win.loadURL('http://localhost:8084');
    } else {
      win.loadURL(`file://${path.join(__static, './guide/index.html')}`);
    }
    win.on('closed', () => {
      win = null;
    });

    win.once('ready-to-show', () => {
      // win.webContents.openDevTools();
      win?.show();
    });
  };
  const getWindow = () => win;

  const operation = {
    close: () => {
      win?.close();
      win = null;
    },
  };

  return {
    init,
    getWindow,
  };
};
