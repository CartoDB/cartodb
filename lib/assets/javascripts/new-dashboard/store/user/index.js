import CartoNode from 'carto-node';

const client = new CartoNode.AuthenticatedClient();

// Data coming from Static Page Loading,
// which requests user and config data from
// /me API endpoint.
const CARTOData = window.CartoConfig.data;

const user = {
  namespaced: true,
  state: {
    ...CARTOData.user_data,
    organizationNotifications: CARTOData.organization_notifications || []
  },
  getters: {},
  mutations: {
    setUserData (state, userData) {
      Object.assign(state, userData);
    }
  },
  actions: {
    updateData (context) {
      client.getConfig(function (err, _, data) {
        if (err) {
          return;
        }

        context.commit('setUserData', data.user_data);
      });
    }
  }
};

export default user;
