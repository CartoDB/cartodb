const AccountMainView = require('dashboard/views/account/account-main-view');
// const UserNotificationView = require('../common/user_notification/user_notification_view');
// const UserNotificationModel = require('../common/user_notification/user_notification_model');
const _ = require('underscore');
const CartoNode = require('carto-node');
const AuthenticatedUser = require('dashboard/data/authenticated-user-model');

const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');

const Locale = require('locale/index');
const Polyglot = require('node-polyglot');

// PROBABLEMENTE ESTO TENGAN QUE SER VARIABLES GLOBALES, O PASARLO POR LAS VISTAS
// HAY QUE MIRAR DONDE SE USA
// const PACKAGE = require('../../../../../package.json');
// const VERSION = PACKAGE.version;
const MAP_ID = 'map';

const ACTIVE_LOCALE = 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);

// Creo que esto no lo necesito, puedo irlo pasando por las vistas
// Quitar todas estas variables de window
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

const InitAccount = function () {
  const client = new CartoNode.AuthenticatedClient();

  const dataLoaded = function (data) {
    const dashboard_notifications = data.dashboard_notifications;
    const userData = data.user_data || {};

    // Config Model
    const configModel = new ConfigModel(
      _.extend(
        { url_prefix: userData.base_url },
        data.config
      )
    );

    const userModel = new UserModel(
      _.extend(userData, {
        auth_username_password_enabled: data.auth_username_password_enabled,
        can_be_deleted: data.can_be_deleted,
        can_change_email: data.can_change_email,
        can_change_password: data.can_change_password,
        cant_be_deleted_reason: data.cant_be_deleted_reason,
        logged_with_google: data.google_sign_in,
        plan_name: data.plan_name,
        plan_url: data.plan_url,
        services: data.services,
        should_display_old_password: data.should_display_old_password
      }),
      {
        groups: userData.groups,
        organization: new OrganizationModel(userData.organization, { configModel })
      }
    );

    document.title = _t('account.title');

    if (!configModel.get('cartodb_com_hosted') && userModel.get('actions').builder_enabled &&
      userModel.get('show_builder_activated_message') && _.isEmpty(dashboard_notifications)) {

        // TODO: PROBAR ESTO

      const userNotificationModel = new UserNotificationModel(dashboard_notifications, {
        key: 'dashboard',
        configModel
      });

      const dashboardNotification = new UserNotificationView({
        notification: userNotificationModel
      });

      // window.dashboardNotification = dashboardNotification;
    }

    const accountMainView = new AccountMainView({
      el: document.body,
      userModel: userModel,
      configModel: configModel,
      client: client
    });

    // $(document.body).bind('click', function () {
    //   cdb.god.trigger('closeDialogs');
    // });
  };

  if (window.CartoConfig.data) {
    dataLoaded();
  } else {
    client.getConfig(function (err, response, data) {
      if (err) {
        console.error(err);
        return err;
      }

      // window.CartoConfig.data = data;
      dataLoaded(data);
    });
  }
}

InitAccount();
