import { BrowserWindow } from 'electron';
import winPosition from './getWinPosition';
import mainInstance from '../index';

// 显示或隐藏主窗口
function mainWindowShowAndHide(mainWindow: BrowserWindow) {
  const currentShow = mainWindow.isVisible();

  // 如果窗口已显示，则隐藏
  if (currentShow) {
    return mainWindow.hide();
  }

  // 检查渲染进程是否就绪
  if (!mainInstance.getRendererReady()) {
    console.log('渲染进程尚未就绪，忽略显示请求');
    return;
  }

  // 显示窗口
  const { x: wx, y: wy } = winPosition.getPosition();
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.focus();
  mainWindow.setVisibleOnAllWorkspaces(false, {
    visibleOnFullScreen: true,
  });
  mainWindow.setPosition(wx, wy);
  mainWindow.show();
}

export { mainWindowShowAndHide };
