import commonConst from '@/common/utils/commonConst';

const getAppSearch = () => {
  if (commonConst.macOS()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./darwin').default;
  } else if (commonConst.windows()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./win').default;
  } else if (commonConst.linux()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./linux').default;
  }
  return () => Promise.resolve([]);
};

export default getAppSearch();
