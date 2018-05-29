const _ = require('underscore');
require('dashboard/data/backbone/sync-options');

const ProfileMainView = require('dashboard/views/profile/profile-main-view');
const UserNotificationView = require('dashboard/components/user-notification/user-notification-view');
const UserNotificationModel = require('dashboard/components/user-notification/user-notification-model');
const OrganizationModel = require('dashboard/data/organization-model');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const AssetsVersionHelper = require('dashboard/helpers/assets-version');
const redirectOrgUsers = require('dashboard/helpers/redirector').redirectOrgUsers;

const Locale = require('locale/index');
const Polyglot = require('node-polyglot');
const PACKAGE = require('../../../../package.json');
const ASSETS_VERSION = AssetsVersionHelper.getAssetsVersion(PACKAGE.version);
const ACTIVE_LOCALE = 'en';

const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

const modals = new ModalsServiceModel();

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */

function dataLoaded (data) {
  const {user_data, dashboard_notifications} = data;

  redirectOrgUsers(user_data.organization, user_data.username, 'profile', window.location);

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

  document.title = 'Your profile | CARTO';

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
