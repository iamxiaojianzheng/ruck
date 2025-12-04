const LOCAL_CONFIG_KEY = 'rubick-local-config';

const localConfig = {
  getConfig(): Promise<any> {
    const data = window.rubick.db.get(LOCAL_CONFIG_KEY) || {};
    return data.data;
  },

  setConfig(data) {
    const localConfig = window.rubick.db.get(LOCAL_CONFIG_KEY) || {};
    window.rubick.db.put({
      _id: LOCAL_CONFIG_KEY,
      _rev: localConfig._rev,
      data: {
        ...localConfig.data,
        ...data,
      },
    });
  },
};

export default localConfig;
