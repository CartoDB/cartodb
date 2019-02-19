import CartoNode from 'carto-node';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

const client = new CartoNode.AuthenticatedClient();

// Data coming from Static Page Loading,
// which requests user and config data from
// /me API endpoint.
const CARTOData = getCARTOData();

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
    },
    setOrganizationNotifications (state, organizationNotifications) {
      state.organizationNotifications = organizationNotifications;
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
    }, 
    emptyOrganizationNotifications(context) {
      const organizationNotifications = [...context.rootState.user.organizationNotifications];
      organizationNotifications.length = 0;
      context.commit('setOrganizationNotifications', organizationNotifications);
    }
  }
};

export default user;
