const _ = require('underscore');
require('dashboard/data/backbone/sync-options');
require('locale/i18n');

const ProfileMainView = require('dashboard/views/profile/profile-main-view');
const UserNotificationView = require('dashboard/components/user-notification/user-notification-view');
const UserNotificationModel = require('dashboard/components/user-notification/user-notification-model');
const OrganizationModel = require('dashboard/data/organization-model');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const AssetsVersionHelper = require('dashboard/helpers/assets-version');

const PACKAGE = require('../../../../package.json');
const ASSETS_VERSION = AssetsVersionHelper.getAssetsVersion(PACKAGE.version);

const modals = new ModalsServiceModel();

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */

function dataLoaded (data) {
  const {user_data, dashboard_notifications, organization_notifications} = data;

  const configModel = new ConfigModel(
    _.extend(
      { url_prefix: user_data.base_url,
        base_url: user_data.base_url },
      data.config
    )
  );

  const userModelOptions = { };

  if (user_data.organization) {
    userModelOptions.organization = new OrganizationModel(user_data.organization, { configModel });
  }

  const currentUser = new UserModel(
    _.extend(user_data, {
      can_change_email: data.can_change_email,
      logged_with_google: false,
      google_enabled: false,
      plan_url: data.plan_url
    }),
    userModelOptions
  );

  document.title = _t('dashboard.profile.your_profile') + _t('carto_name');

  if (!configModel.get('cartodb_com_hosted')) {
    if (currentUser.get('actions').builder_enabled &&
        currentUser.get('show_builder_activated_message') &&
        _.isEmpty(dashboard_notifications)) {
      const userNotificationModel = new UserNotificationModel(dashboard_notifications, {
        key: 'dashboard',
        configModel
      });

      new UserNotificationView({ // eslint-disable-line
        notification: userNotificationModel
      });
    }
  }

  new ProfileMainView({ // eslint-disable-line
    el: document.body,
    userModel: currentUser,
    configModel,
    modals,
    organizationNotifications: organization_notifications,
    assetsVersion: ASSETS_VERSION
  });
}

if (window.CartoConfig.data) {
  dataLoaded(window.CartoConfig.data);
} else {
  const client = new CartoNode.AuthenticatedClient();

  client.getConfig(function (err, response, data) {
    if (err) {
      console.error(err);
      return err;
    } else {
      dataLoaded(data);
    }
  });
}
