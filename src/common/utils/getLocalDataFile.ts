import path from 'path';
import fs from 'fs';

export default (): string => {
  const localDataFile = process.env.HOME || process.env.LOCALAPPDATA;
  if (!localDataFile) {
    throw new Error('Home directory not found');
  }
  const rubickPath = path.join(localDataFile, 'rubick');
  if (!fs.existsSync(rubickPath)) {
    fs.mkdirSync(rubickPath);
  }
  return rubickPath;
};
