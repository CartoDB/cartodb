// Data coming from Static Page Loading,
// which requests user and config data from
// /me API endpoint.
const CARTOData = window.CartoConfig.data;

const user = {
  namespaced: true,
  state: {
    ...CARTOData.user_data
  },
  getters: {},
  mutations: {},
  actions: {}
};

export default user;
