const Polyglot = require('node-polyglot');
const $ = require('jquery');
const _ = require('underscore');
const Locale = require('../locale/index');
const UserModel = require('./data/user-model');
const ConfigModel = require('./data/config-model');
const DashboardHeaderView = require('./components/dashboard-header-view');
const SupportView = require('./components/support-view');
const HeaderViewModel = require('./views/api-keys/header-view-model');
const RegenerateKeysView = require('./views/api-keys/regenerate-keys-view');
const UpgradeMessageView = require('./components/upgrade-message-view');
const UserNotificationView = require('./components/user-notification/user-notification-view');
const UserNotificationModel = require('./components/user-notification/user-notification-model');
const ModalsServiceModel = require('../cartodb3/components/modals/modals-service-model');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const configModel = new ConfigModel(
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
  const currentUser = new UserModel(window.user_data, { configModel });
  const modals = new ModalsServiceModel();

  const headerView = new DashboardHeaderView({
    el: $('#header'), // pre-rendered in DOM by Rails app
    model: currentUser,
    configModel: configModel,
    viewModel: new HeaderViewModel()
  });
  headerView.render();

  const upgradeMessage = new UpgradeMessageView({
    configModel: configModel,
    userModel: currentUser
  });

  $('.Header').after(upgradeMessage.render().el);

  const supportView = new SupportView({
    el: $('#support-banner'),
    userModel: currentUser
  });
  supportView.render();

  $('.js-regenerateApiKey').bind('click', function (event) {
    if (event) event.preventDefault();

    const action = currentUser.get('base_url') + '/your_apps/api_key/regenerate';
    const authenticity_token = $('[name=authenticity_token][value]').get(0).value;

    modals.create(function () {
      return new RegenerateKeysView({
        type: 'api',
        scope: 'user',
        mobile_enabled: window.mobile_enabled,
        form_action: action,
        authenticity_token: authenticity_token
      });
    });
  });

  $('.js-regenerateOauth').bind('click', function (event) {
    if (event) event.preventDefault();

    const action = currentUser.get('base_url') + '/your_apps/oauth/regenerate';
    const authenticity_token = $('[name=authenticity_token][value]').get(0).value;

    modals.create(function () {
      return new RegenerateKeysView({
        type: 'oauth',
        scope: 'user',
        form_action: action,
        authenticity_token: authenticity_token,
        method: 'delete'
      });
    });
  });

  if (!currentUser.get('cartodb_com_hosted')) {
    if (currentUser.get('actions').builder_enabled && currentUser.get('show_builder_activated_message') &&
        _.isEmpty(window.dashboard_notifications)) {
      const userNotificationModel = new UserNotificationModel(window.dashboard_notifications, {
        key: 'dashboard',
        configModel: configModel
      });

      const dashboardNotification = new UserNotificationView({
        notification: userNotificationModel
      });

      window.dashboardNotification = dashboardNotification;
    }
  }
});
