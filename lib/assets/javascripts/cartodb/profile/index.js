var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
// var Router = require('./router');
var ProfileView = require('./profile_view');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function () {
  cdb.init(function () {
    function getAssetsVersion () {
      var query = window.location.search.substring(1);
      var vars = query.split('&');

      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');

        if (pair[0] === 'v') {
          return pair[1];
        }
      }

      return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || cdb.config.get('assets_url').split('/assets/')[1];
    }

    function dataLoaded () {
      var data = window.CartoConfig.data;

      var user_data = data.user_data;
      var config = data.config;
      var dashboard_notifications = data.dashboard_notifications;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set('url_prefix', user_data.base_url);
      cdb.config.set(config); // import config

      var currentUser = new cdb.admin.User(
        _.extend(user_data, {
          logged_with_google: false,
          google_enabled: false
        })
      );

      document.title = 'Your profile | CARTO';

      cdb.config.set('user', currentUser);

      // var router = new Router({
      //   dashboardUrl: currentUser.viewUrl().dashboard()
      // });

      if (!cdb.config.get('cartodb_com_hosted')) {
        if (currentUser.get('actions').builder_enabled &&
            currentUser.get('show_builder_activated_message') &&
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

      var profileView = new ProfileView({
        el: document.body,
        // TODO: authenticity_token
        authenticityToken: window.authenticity_token,
        user: currentUser,
        config: config
      });

      $(document.body).bind('click', function () {
        cdb.god.trigger('closeDialogs');
      });
    }

    if (window.CartoConfig.data) {
      dataLoaded();
    } else {
      var client = new Carto.AuthenticatedClient();

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
});
