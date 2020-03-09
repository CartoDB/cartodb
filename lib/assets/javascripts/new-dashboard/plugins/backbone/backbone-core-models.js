import Vue from 'vue';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';
import OrganizationModel from 'dashboard/data/organization-model';
import UserGroupsCollection from 'dashboard/data/user-groups-collection';
import BackgroundPollingModel from 'dashboard/data/background-polling/dashboard-background-polling-model';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

const BackboneCoreModels = {};

BackboneCoreModels.install = function (Vue, options) {
  Vue.mixin({
    beforeCreate () {
      this.$cartoModels = options;
    }
  });
};

const CARTOData = getCARTOData();

const configModel = new ConfigModel({
  ...CARTOData.config,
  base_url: CARTOData.user_data.base_url
});
const userModel = configureUserModel(CARTOData.user_data);

const backgroundPollingModel = new BackgroundPollingModel({
  showGeocodingDatasetURLButton: true,
  geocodingsPolling: true,
  importsPolling: true
}, { configModel, userModel });

Vue.use(BackboneCoreModels, {
  config: configModel,
  user: userModel,
  backgroundPolling: backgroundPollingModel
});

function configureUserModel (userData) {
  const userModel = new UserModel(userData);

  if (userData.organization) {
    userModel.setOrganization(new OrganizationModel(userData.organization, { configModel }));
  }

  if (userData.groups) {
    userModel.setGroups(new UserGroupsCollection(userData.groups, { configModel }));
  }

  return userModel;
}
