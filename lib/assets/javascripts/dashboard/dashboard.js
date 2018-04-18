const _ = require('underscore');

const Locale = require('locale/index');
const Polyglot = require('node-polyglot');
const ACTIVE_LOCALE = 'en';

const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);

const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const CreateDialog = require('dashboard/views/dashboard/dialogs/create-dialog/sacar-fuera/dialog-view');
const OrganizationModel = require('dashboard/data/organization-model');
const UserNotificationView = require('dashboard/components/dashboard-header/notifications/user-notifications-view');
const UserNotificationModel = require('dashboard/components/user-notification/user-notification-model');
const DashboardBackgroundPollingModel = require('dashboard/data/background-polling/dashboard-background-polling-model');
const BackgroundPollingView = require('dashboard/views/dashboard/background-polling/background-polling-view');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const MetricsTracker = require('dashboard/views/dashboard/metrics-tracker');
const Router = require('dashboard/common/router-dashboard');
const MainView = require('dashboard/views/dashboard/main-view');

require('dashboard/data/backbone/sync-options');

const DEFAULT_VIS_NAME = 'Untitled map';

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

function getAssetsVersion (configModel) {
  const query = window.location.search.substring(1);
  const vars = query.split('&');

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');

    if (pair[0] === 'v') {
      return pair[1];
    }
  }

  return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || configModel.get('assets_url').split('/assets/')[1];
}

function dataLoaded (data) {
  const userData = data.user_data;
  const default_fallback_basemap = data.default_fallback_basemap;
  const dashboard_notifications = data.dashboard_notifications;
  const isJustLoggedIn = data.isJustLoggedIn;
  const isFirstTimeViewingDashboard = data.isFirstTimeViewingDashboard;

  const configModel = new ConfigModel(
    _.extend(
      data.config,
      { base_url: userData.base_url,
        url_prefix: userData.base_url,
        default_fallback_basemap }
    )
  );

  const currentUser = new UserModel(userData);

  if (userData.organization) {
    currentUser.setOrganization(new OrganizationModel(userData.organization, { configModel }));
  }

  document.title = currentUser.get('username') + ' | CARTO';

  // cdb.config.set('user', currentUser);

  const router = new Router({
    dashboardUrl: currentUser.viewUrl().dashboard()
  });

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

  // Why not have only one collection?
  const collection = new VisualizationsCollection(null, { configModel });

  const backgroundPollingModel = new DashboardBackgroundPollingModel({
    showGeocodingDatasetURLButton: true,
    geocodingsPolling: true,
    importsPolling: true
  }, {
    userModel: currentUser,
    configModel
  });

  const backgroundPollingView = new BackgroundPollingView({
    model: backgroundPollingModel,
    // Only create a visualization from an import if user is in maps section
    createVis: router.model.isMaps(),
    userModel: currentUser,
    configModel
  });
  debugger;

  const dashboard = new MainView({
    el: document.body,
    collection,
    userModel: currentUser,
    configModel,
    routerModel: router,
    backgroundPollingModel,
    backgroundPollingView,
    assetsVersion: getAssetsVersion()
  });
  window.dashboard = dashboard;

  router.enableAfterMainView();

  const metrics = new MetricsTracker();

  // Event tracking "Visited Dashboard"
  metrics.trackEvent('visited_dashboard', {
    email: userData.email
  });

  if (isJustLoggedIn) {
    // Event tracking "Logged in"
    metrics.trackEvent('logged_in', {
      email: userData.email
    });
  }

  if (isFirstTimeViewingDashboard) {
    // Event tracking "Visited Dashboard for the first time"
    metrics.trackEvent('visited_dashboard_first_time', {
      email: userData.email
    });
  }

  CreateDialog.setViewProperties({
    configModel,
    userModel: currentUser,
    pollingModel: backgroundPollingModel,
    pollingView: backgroundPollingView
  });

  // cdb.god.bind('openCreateDialog', function (dialog) {
  //   let createModel;
  //   dialog = dialog || {};
  //   if (dialog.type === 'dataset') {
  //     createModel = new CreateDatasetModel({}, {
  //       user: currentUser
  //     });
  //   } else {
  //     mapModel.setSelected(dialog.selectedItems);
  //     createModel = mapModel;
  //   }

  //   const createDialog = new CreateDialog({
        // 'modalModel',
        // 'createModel',
        // 'configModel',
        // 'userModel',
        // 'pollingModel'
  //   });

  //   createModel.bind('datasetCreated', function (tableMetadata) {
  //     let vis;

  //     if (router.model.isDatasets()) {
  //       vis = new cdb.admin.Visualization({ type: 'table' });
  //       vis.permission.owner = currentUser;
  //       vis.set('table', tableMetadata.toJSON());
  //       window.location = vis.viewUrl(currentUser).edit();
  //     } else {
  //       vis = new cdb.admin.Visualization({ name: DEFAULT_VIS_NAME });
  //       vis.save({
  //         tables: [ tableMetadata.get('id') ]
  //       }, {
  //         success: function (m) {
  //           window.location = vis.viewUrl(currentUser).edit();
  //         },
  //         error: function (e) {
  //           createDialog.close();
  //           collection.trigger('error');
  //         }
  //       });
  //     }
  //   }, this);

  //   createDialog.appendToBody();
  //   createModel.viewsReady();
  // });
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
      window.CartoConfig.data = data;
      dataLoaded(data);
    }
  });
}
