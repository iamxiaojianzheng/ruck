import clipboardFiles from 'clipboard-files';
import fs from 'fs';
import path from 'path';
import ofs from 'original-fs';

export default function getCopyFiles(): Array<FileInfo> | null {
  const filePaths = clipboardFiles.readFiles();
  if (!Array.isArray(filePaths)) return null;
  const copyFiles: Array<FileInfo> = filePaths
    .map((p: string) => {
      if (!fs.existsSync(p)) return false;
      let fileInfo: fs.Stats;
      try {
        fileInfo = ofs.lstatSync(p);
      } catch (e) {
        return false;
      }
      return {
        isFile: fileInfo.isFile(),
        isDirectory: fileInfo.isDirectory(),
        name: path.basename(p) || p,
        path: p,
      };
    })
    .filter((item): item is FileInfo => item !== false);
  return copyFiles.length ? copyFiles : null;
}
