var $ = require('jquery-cdb-v3');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 * Entry point for the profile.
 */
$(function() {
  cdb.init(function() {
    var currentUser = new cdb.admin.User(window.user_data);

    if (!cdb.config.get('cartodb_com_hosted')) {
      if (currentUser.get('actions').builder_enabled && currentUser.get('show_builder_activated_message') &&
          _.isEmpty(window.dashboard_notifications)) {
        var userNotificationModel = new UserNotificationModel(window.dashboard_notifications, {
          key: 'dashboard',
          configModel: cdb.config
        });

        var dashboardNotification = new UserNotificationView({
          notification: userNotificationModel
        });

        window.dashboardNotification = dashboardNotification;
      }
    }
  });
});
