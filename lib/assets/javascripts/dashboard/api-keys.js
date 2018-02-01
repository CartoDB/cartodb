const Polyglot = require('node-polyglot');
const $ = require('jquery');
const _ = require('underscore');
const Locale = require('../locale/index');
const UserModel = require('./data/user-model');
const ConfigModel = require('./data/config-model');
const DashboardHeaderView = require('./components/dashboard-header-view');
const SupportView = require('./components/support-view');
const HeaderViewModel = require('./views/api-keys/header-view-model');
const RegenerateKeysDialogView = require('./views/api-keys/regenerate-keys-dialog-view');


var UpgradeMessage = require('../common/upgrade_message_view');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');

var ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.base_url
    },
    window.config
  )
);

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function () {
  var currentUser = new UserModel(window.user_data);

  var headerView = new DashboardHeaderView({
    el: $('#header'), // pre-rendered in DOM by Rails app
    model: currentUser,
    configModel: configModel,
    viewModel: new HeaderViewModel()
  });
  headerView.render();

  var upgradeMessage = new UpgradeMessage({
    model: currentUser
  });

  $('.Header').after(upgradeMessage.render().el);

  var supportView = new SupportView({
    el: $('#support-banner'),
    userModel: currentUser
  });
  supportView.render();

  $('.js-regenerateApiKey').bind('click', function (ev) {
    if (ev) ev.preventDefault();
    var action = currentUser.get('base_url') + '/your_apps/api_key/regenerate';
    var authenticity_token = $('[name=authenticity_token][value]').get(0).value;
    var dialog = new RegenerateKeysDialogView({
      type: 'api',
      scope: 'user',
      mobile_enabled: window.mobile_enabled,
      form_action: action,
      authenticity_token: authenticity_token
    });

    dialog.appendToBody();
  });

  $('.js-regenerateOauth').bind('click', function (ev) {
    if (ev) ev.preventDefault();
    var action = currentUser.get('base_url') + '/your_apps/oauth/regenerate';
    var authenticity_token = $('[name=authenticity_token][value]').get(0).value;
    var dialog = new RegenerateKeysDialogView({
      type: 'oauth',
      scope: 'user',
      form_action: action,
      authenticity_token: authenticity_token,
      method: 'delete'
    });

    dialog.appendToBody();
  });

  if (!currentUser.get('cartodb_com_hosted')) {
    if (currentUser.get('actions').builder_enabled && currentUser.get('show_builder_activated_message') &&
        _.isEmpty(window.dashboard_notifications)) {
      var userNotificationModel = new UserNotificationModel(window.dashboard_notifications, {
        key: 'dashboard',
        configModel: configModel
      });

      var dashboardNotification = new UserNotificationView({
        notification: userNotificationModel
      });

      window.dashboardNotification = dashboardNotification;
    }
  }
});
