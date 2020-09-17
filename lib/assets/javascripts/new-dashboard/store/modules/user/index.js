import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

import * as getters from '../../getters/user';

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
    canCreateMaps: getters.canCreateMaps,
    isViewer: getters.isViewer,
    hasEngine: getters.hasEngine,
    userNotification: getters.userNotification,
    isNotificationVisible: getters.isNotificationVisible,
    publicMapsCount: getters.getPublicMapsCount,
    publicMapsQuota: getters.getPublicMapsQuota,
    isOutOfPublicMapsQuota: getters.isOutOfPublicMapsQuota,
    privateMapsCount: getters.getPrivateMapsCount,
    privateMapsQuota: getters.getPrivateMapsQuota,
    isOutOfPrivateMapsQuota: getters.isOutOfPrivateMapsQuota,
    datasetsCount: getters.getDatasetsCount,
    datasetsQuota: getters.getDatasetsQuota,
    isOutOfDatasetsQuota: getters.isOutOfDatasetsQuota,
    isOrganizationUser: getters.isOrganizationUser,
    isMobileSDKEnabled: getters.isMobileSDKEnabled
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
    },
    updateTableCount (state, newTableCount) {
      state.table_count = newTableCount;
    }
  },
  actions: {
    updateData (context) {
      context.rootState.client.getConfig(function (err, _, data) {
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
    },
    updateTableCount (context, newTableCount) {
      context.commit('updateTableCount', newTableCount);
    }
  }
};

export default user;
