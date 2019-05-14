import CartoNode from 'carto-node';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

import { canCreateDatasets, isViewer, hasEngine, notification, isNotificationVisible } from './getters';

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
    isNotificationVisible: true
  },
  getters: {
    canCreateDatasets,
    isViewer,
    hasEngine,
    notification,
    isNotificationVisible
  },
  mutations: {
    setUserData (state, userData) {
      Object.assign(state, userData);
    },
    setOrganizationNotifications (state, organizationNotifications) {
      state.organizationNotifications = organizationNotifications;
    },
    setIsNotificationVisible (state, isNotificationVisible) {
      state.isNotificationVisible = isNotificationVisible;
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
      context.commit('setIsNotificationVisible', false);
    }
  }
};

export default user;
