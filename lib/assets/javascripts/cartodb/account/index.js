var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var AccountMainView = require('./account_main_view');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');

var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';
var PACKAGE = require('../../../../../package.json');
var VERSION = PACKAGE.version;
var MAP_ID = 'map';

var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

var InitAccount = function () {
  cdb.init(function () {
    var client = new CartoNode.AuthenticatedClient();

    var dataLoaded = function () {
      var data = window.CartoConfig.data;
      var userData = data.user_data;
      var config = data.config;
      var dashboard_notifications = data.dashboard_notifications;

      cdb.templates.namespace = 'cartodb/';

      if (userData) {
        cdb.config.set('url_prefix', userData.base_url);
        cdb.config.set(config);
      } else {
        userData = {};
      }

      var currentUser = new cdb.admin.User(
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
        })
      );

      document.title = _t('account.title');

      cdb.config.set('user', currentUser);

      if (!cdb.config.get('cartodb_com_hosted')) {
        if (currentUser.get('actions').builder_enabled && currentUser.get('show_builder_activated_message') &&
            _.isEmpty(dashboard_notifications)) {
          var userNotificationModel = new UserNotificationModel(dashboard_notifications, {
            key: 'dashboard',
            configModel: cdb.config
          });

          var dashboardNotification = new UserNotificationView({
            notification: userNotificationModel
          });

          window.dashboardNotification = dashboardNotification;
        }
      }

      var accountMainView = new AccountMainView({
        el: document.body,
        user: currentUser,
        config: config,
        client: client
      });

      $(document.body).bind('click', function () {
        cdb.god.trigger('closeDialogs');
      });
    }

    if (window.CartoConfig.data) {
      dataLoaded();
    } else {
      client.getConfig(function (err, response, data) {
        if (err) {
          console.error(err);
          return err;
        } else {
          window.CartoConfig.data = data;
          dataLoaded();
        }
      });
    }
  });
}

InitAccount();
