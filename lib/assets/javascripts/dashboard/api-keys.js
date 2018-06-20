const Polyglot = require('node-polyglot');
const Locale = require('locale/index');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
require('dashboard/data/backbone/sync-options');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');
const ConfigModel = require('dashboard/data/config-model');
const DashboardHeaderView = require('dashboard/components/dashboard-header-view');
const SupportView = require('dashboard/components/support-view');
const HeaderViewModel = require('dashboard/views/api-keys/header-view-model');
const UpgradeMessageView = require('dashboard/components/upgrade-message-view');
const AuthMessageView = require('dashboard/components/auth-message-view');
const UserNotificationView = require('dashboard/components/user-notification/user-notification-view');
const ApiKeysListView = require('dashboard/views/api-keys/api-keys-list-view');
const ApiKeysFormView = require('dashboard/views/api-keys/api-keys-form-view');
const StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
const UserNotificationModel = require('dashboard/components/user-notification/user-notification-model');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');
const UserTablesModel = require('dashboard/data/user-tables-model');
const getObjectValue = require('deep-insights/util/get-object-value');

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
  const userModel = new UserModel(window.user_data, { configModel });
  // User has an organization
  if (window.user_data.organization) {
    const organization = new OrganizationModel(window.user_data, {
      currentUserId: window.user_data.id,
      configModel
    });
    organization.owner = new UserModel(getObjectValue(window.user_data, 'organization.owner'));
    userModel.setOrganization(organization);
  }

  const headerView = new DashboardHeaderView({
    el: $('#header'), // pre-rendered in DOM by Rails app
    model: userModel,
    configModel: configModel,
    viewModel: new HeaderViewModel()
  });
  headerView.render();

  const upgradeMessage = new UpgradeMessageView({
    configModel: configModel,
    userModel: userModel
  });

  $('.Header').after(upgradeMessage.render().el);

  if (userModel.featureEnabled('auth_api')) {
    const authMessageView = new AuthMessageView();
    $('.Header').after(authMessageView.render().el);
  }

  const supportView = new SupportView({
    el: $('#support-banner'),
    userModel: userModel
  });
  supportView.render();

  const apiKeysCollection = new ApiKeysCollection(null, { userModel });
  const userTablesModel = new UserTablesModel(null, { userModel });

  // Prefetch user tables for new api key form
  userTablesModel.fetch();

  // Debug
  window.userTablesModel = userTablesModel;
  window.apiKeysCollection = apiKeysCollection;

  const stackLayoutCollection = new Backbone.Collection([
    {
      createStackView: (stackLayoutModel) =>
        new ApiKeysListView({ apiKeysCollection, userModel, stackLayoutModel })
    },
    {
      createStackView: (stackLayoutModel, [apiKeyModel, ...other]) =>
        new ApiKeysFormView({
          apiKeysCollection,
          stackLayoutModel,
          apiKeyModel,
          userTablesModel,
          userModel
        })
    }
  ]);

  const stackLayout = new StackLayoutView({
    collection: stackLayoutCollection
  });

  $('.js-api-keys-new').append(stackLayout.render().el);

  if (!userModel.get('cartodb_com_hosted')) {
    if (userModel.get('actions').builder_enabled && userModel.get('show_builder_activated_message') &&
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
