import CartoNode from 'carto-node';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

import * as getters from './getters';

const client = new CartoNode.AuthenticatedClient();

// Data coming from Static Page Loading,
// which requests user and config data from
// /me API endpoint.
const CARTOData = getCARTOData();

const user = {
  namespaced: true,
  state: {
    ...CARTOData.user_data,
    organizationNotifications: CARTOData.organization_notifications || [],
    showNotification: true
  },
  getters: {
    canCreateDatasets: getters.canCreateDatasets,
    isViewer: getters.isViewer,
    hasEngine: getters.hasEngine,
    userNotification: getters.userNotification,
    isNotificationVisible: getters.isNotificationVisible,
    publicMapsCount: getters.getPublicMapsCount,
    publicMapsQuota: getters.getPublicMapsQuota,
    isOutOfPublicMapsQuota: getters.isOutOfPublicMapsQuota,
    datasetsCount: getters.getDatasetsCount,
    datasetsQuota: getters.getDatasetsQuota,
    isOutOfDatasetsQuota: getters.isOutOfDatasetsQuota
  },
  mutations: {
    setUserData (state, userData) {
      Object.assign(state, userData);
    },
    setOrganizationNotifications (state, organizationNotifications) {
      state.organizationNotifications = organizationNotifications;
    },
    setShowNotification (state, showNotification) {
      state.showNotification = showNotification;
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
    resetOrganizationNotifications (context) {
      context.commit('setOrganizationNotifications', []);
    },
    hideUserNotification (context) {
      context.commit('setShowNotification', false);
    }
  }
};

export default user;
