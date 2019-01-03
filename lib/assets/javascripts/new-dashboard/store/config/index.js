import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

// Data coming from Static Page Loading,
// which requests user and config data from
// /me API endpoint.
const CARTOData = getCARTOData();
const CARTOUserData = CARTOData.user_data;

const config = {
  namespaced: true,
  state: {
    ...CARTOData.config,
    base_url: CARTOUserData.base_url,
    url_prefix: CARTOUserData.base_url,
    default_fallback_basemap: CARTOData.default_fallback_basemap,
    isFirstTimeViewingDashboard: CARTOData.is_first_time_viewing_dashboard,
    accountUpdateURL: CARTOData.account_update_url
  },
  getters: {},
  mutations: {},
  actions: {}
};

export default config;
