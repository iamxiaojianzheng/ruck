// for referer policy, we can't use it in renderer
import axios from 'axios';
import { mainLogger as logger } from '@/common/logger';
const RELEASE_URL = 'https://api.github.com/repos/iamxiaojianzheng/ruck/releases';

export const getLatestVersion = async (isCheckBetaUpdate = false) => {
  let res = '';
  try {
    res = await axios
      .get(RELEASE_URL, {
        headers: {
          Referer: 'https://github.com',
        },
      })
      .then((r) => {
        const list = r.data;
        if (list?.length < 1) return;
        if (isCheckBetaUpdate) {
          const betaList = list.filter((item) => item.name.includes('beta'));
          return betaList[0].name;
        }
        const normalList = list.filter((item) => !item.name.includes('beta'));
        return normalList[0].name;
      });
  } catch (err) {
    logger.warn('获取最新版本信息失败', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return res;
};
