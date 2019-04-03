const _ = require('underscore');

require('dashboard/data/backbone/sync-options');
require('locale/i18n');

const LocalStorage = require('dashboard/helpers/local-storage');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const CreateDialog = require('dashboard/views/dashboard/dialogs/create-dialog/dialog-view');
const OrganizationModel = require('dashboard/data/organization-model');
const UserGroupsCollection = require('dashboard/data/user-groups-collection');
const DashboardBackgroundPollingModel = require('dashboard/data/background-polling/dashboard-background-polling-model');
const BackgroundPollingView = require('dashboard/views/dashboard/background-polling/background-polling-view');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const MetricsTracker = require('dashboard/views/dashboard/metrics-tracker');
const MetricsTypes = require('builder/components/metrics/metrics-types');

const Router = require('dashboard/common/router-dashboard');
const MainView = require('dashboard/views/dashboard/main-view');

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();

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
  const organizationNotifications = data.organization_notifications;
  const isJustLoggedIn = data.isJustLoggedIn;
  const isFirstTimeViewingDashboard = data.isFirstTimeViewingDashboard;

  resetOrderWhenLikesIsApplied();

  const configModel = new ConfigModel(
    _.extend(
      data.config,
      {
        base_url: userData.base_url,
        url_prefix: userData.base_url,
        default_fallback_basemap
      }
    )
  );

  const currentUser = new UserModel(userData);

  if (userData.organization) {
    currentUser.setOrganization(new OrganizationModel(userData.organization, { configModel }));
  }

  if (userData.groups) {
    currentUser.setGroups(new UserGroupsCollection(userData.groups, { configModel }));
  }

  document.title = currentUser.get('username') + ' | ' + _t('carto_name');

  const router = new Router({
    dashboardUrl: currentUser.viewUrl().dashboard()
  });

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

  const dashboard = new MainView({
    el: document.body,
    collection,
    userModel: currentUser,
    configModel,
    routerModel: router,
    backgroundPollingModel,
    backgroundPollingView,
    organizationNotifications,
    assetsVersion: getAssetsVersion()
  });
  window.dashboard = dashboard;

  router.enableAfterMainView();

  // Event tracking "Visited Dashboard"
  const InternalMetricsTracker = require('builder/components/metrics/metrics-tracker');
  InternalMetricsTracker.init({
    userId: currentUser.get('id'),
    configModel
  });

  InternalMetricsTracker.track(MetricsTypes.VISITED_PRIVATE_PAGE, {
    page: 'dashboard'
  });

  const metrics = new MetricsTracker();
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
    pollingView: backgroundPollingView,
    routerModel: router
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
      window.CartoConfig.data = data;
      dataLoaded(data);
    }
  });
}

function resetOrderWhenLikesIsApplied () {
  const localStorageInstance = new LocalStorage();
  const dashboardOrder = localStorageInstance.get('dashboard.order');

  if (dashboardOrder === 'likes') {
    localStorageInstance.set({'dashboard.order': 'updated_at'});
  }
}
