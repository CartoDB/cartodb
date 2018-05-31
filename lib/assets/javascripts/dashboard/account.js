const _ = require('underscore');
const Polyglot = require('node-polyglot');
const CartoNode = require('carto-node');
const AccountMainView = require('dashboard/views/account/account-main-view');
const UserNotificationView = require('dashboard/components/user-notification/user-notification-view');
const UserNotificationModel = require('dashboard/components/user-notification/user-notification-model');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');
const AssetsVersionHelper = require('dashboard/helpers/assets-version');
const redirectOrgUsers = require('dashboard/helpers/redirector').redirectOrgUsers;

const Locale = require('locale/index');

const PACKAGE = require('../../../../package.json');
const ACTIVE_LOCALE = 'en';

const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

document.title = _t('account.title');

const InitAccount = function () {
  const client = new CartoNode.AuthenticatedClient();

  const dataLoaded = function (data) {
    const ASSETS_VERSION = AssetsVersionHelper.getAssetsVersion(PACKAGE.version);
    const dashboard_notifications = data.dashboard_notifications;
    const userData = data.user_data || {};
    redirectOrgUsers(userData.organization, userData.username, 'account', window.location);

    const configModel = new ConfigModel(
      _.extend(
        { url_prefix: userData.base_url },
        data.config
      )
    );

    const userModelOptions = { groups: userData.groups };

    if (userData.organization) {
      userModelOptions.organization = new OrganizationModel(userData.organization, { configModel });
    }

    const userModel = new UserModel(
      _.extend(userData, {
        auth_username_password_enabled: data.auth_username_password_enabled,
        can_be_deleted: data.can_be_deleted,
        can_change_password: data.can_change_password,
        cant_be_deleted_reason: data.cant_be_deleted_reason,
        logged_with_google: data.google_sign_in,
        plan_name: data.plan_name,
        plan_url: data.plan_url,
        services: data.services,
        should_display_old_password: data.should_display_old_password
      }), userModelOptions
    );

    if (!configModel.get('cartodb_com_hosted') && userModel.get('actions').builder_enabled &&
        userModel.get('show_builder_activated_message') && _.isEmpty(dashboard_notifications)) {
      const userNotificationModel = new UserNotificationModel(dashboard_notifications, {
        key: 'dashboard',
        configModel
      });

      new UserNotificationView({ // eslint-disable-line no-new
        notification: userNotificationModel
      });
    }

    new AccountMainView({ // eslint-disable-line no-new
      el: document.body,
      userModel: userModel,
      configModel: configModel,
      assetsVersion: ASSETS_VERSION,
      client: client
    });
  };

  if (window.CartoConfig && window.CartoConfig.data) {
    dataLoaded(window.CartoConfig.data);
  } else {
    client.getConfig(function (err, response, data) {
      if (err) {
        console.error(err);
        return err;
      }

      window.CartoConfig.data = data;
      dataLoaded(data);
    });
  }
};

InitAccount();
