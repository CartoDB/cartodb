
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
    default_fallback_basemap: CARTOData.default_fallback_basemap
  },
  getters: {},
  mutations: {},
  actions: {}
};

export default config;
