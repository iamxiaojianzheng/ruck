import { app } from '@electron/remote';
import path from 'path';
import { PLUGIN_INSTALL_DIR_NAME } from '@/common/constants';

const appPath = app.getPath('userData');

const PLUGIN_INSTALL_DIR = path.join(appPath, PLUGIN_INSTALL_DIR_NAME);
const PLUGIN_INSTALL_ROOT_DIR = path.join(appPath, PLUGIN_INSTALL_DIR_NAME, 'node_modules');
const PLUGIN_HISTORY = 'rubick-plugin-history';

export { PLUGIN_INSTALL_DIR, PLUGIN_INSTALL_ROOT_DIR, PLUGIN_HISTORY };
