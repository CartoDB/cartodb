import ConfigModel from 'dashboard/data/config-model';

// Data coming from Static Page Loading,
// which requests user and config data from
// /me API endpoint.
const CARTOData = window.CartoConfig.data;
const CARTOUserData = CARTOData.user_data;

const config = {
  namespaced: true,
  state: {
    ...CARTOData.config,
    base_url: CARTOUserData.base_url,
    url_prefix: CARTOUserData.base_url,
    default_fallback_basemap: CARTOData.default_fallback_basemap,
    configModel: new ConfigModel(CARTOData.user_data)
  },
  getters: {},
  mutations: {},
  actions: {}
};

export default config;
