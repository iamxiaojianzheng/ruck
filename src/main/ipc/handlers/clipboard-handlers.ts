/**
 * 剪贴板相关的 IPC 处理器
 */

import { clipboard, nativeImage } from 'electron';
import clipboardFiles from 'clipboard-files';
import type { IPCHandler } from '@/types/ipc';
import getCopyFiles from '@/common/utils/getCopyFiles';
import fs from 'fs';
import { mainLogger as logger } from '@/common/logger';

/**
 * 文件路径合法性校验
 */
const sanitizeInputFiles = (input: unknown): string[] => {
  const candidates = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
  return candidates
    .map((filePath) => (typeof filePath === 'string' ? filePath.trim() : ''))
    .filter((filePath) => {
      if (!filePath) return false;
      try {
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    });
};

/**
 * 复制图片
 */
export const copyImage: IPCHandler<'clipboard:copyImage'> = (event, { img }) => {
  try {
    const image = nativeImage.createFromDataURL(img);
    clipboard.writeImage(image);
    return true;
  } catch (error) {
    logger.error('复制图片失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * 复制文本
 */
export const copyText: IPCHandler<'clipboard:copyText'> = (event, { text }) => {
  try {
    clipboard.writeText(String(text));
    return true;
  } catch (error) {
    logger.error('复制文本失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * 复制文件
 */
export const copyFile: IPCHandler<'clipboard:copyFile'> = (event, { file }) => {
  try {
    const targetFiles = sanitizeInputFiles(file);

    if (!targetFiles.length) {
      return false;
    }

    clipboardFiles.writeFiles(targetFiles);
    return true;
  } catch (error) {
    logger.error('复制文件失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * 获取剪贴板中的文件
 */
export const getClipboardFiles: IPCHandler<'clipboard:getFiles'> = () => {
  return getCopyFiles();
};
