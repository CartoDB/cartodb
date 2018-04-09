const _ = require('underscore');

const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');

const Router = require('dashboard/common/router-dashboard');
// const MainView = require('./main_view_static');
// const ChangePrivacyDialog = require('../common/dialogs/change_privacy/change_privacy_view');
// const CreateDialog = require('../common/dialogs/create/create_view');
// const CreateDatasetModel = require('../common/dialogs/create/create_dataset_model');
// const CreateMapModel = require('../common/dialogs/create/create_map_model');
// const UserNotificationView = require('../common/user_notification/user_notification_view');
// const UserNotificationModel = require('../common/user_notification/user_notification_model');
const DEFAULT_VIS_NAME = 'Untitled map';

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

function getAssetsVersion () {
  const query = window.location.search.substring(1);
  const vars = query.split('&');

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');

    if (pair[0] === 'v') {
      return pair[1];
    }
  }

  return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || cdb.config.get('assets_url').split('/assets/')[1];
}

function dataLoaded (data) {
  const user_data = data.user_data;
  const default_fallback_basemap = data.default_fallback_basemap;
  const config = data.config;
  const dashboard_notifications = data.dashboard_notifications;
  const isJustLoggedIn = data.isJustLoggedIn;
  const isFirstTimeViewingDashboard = data.isFirstTimeViewingDashboard;

  const configModel = new ConfigModel(
    _.extend(
      { url_prefix: user_data.base_url,
        default_fallback_basemap },
      data.config
    )
  );

  const currentUser = new UserModel(user_data);

  if (user_data.organization) {
    currentUser.setOrganization(new OrganizationModel(user_data.organization, { configModel }));
  }

  document.title = currentUser.get('username') + ' | CARTO';

  // cdb.config.set('user', currentUser);

  const router = new Router({
    dashboardUrl: currentUser.viewUrl().dashboard()
  });

  const mapModel = new CreateMapModel({}, {
    user: currentUser
  });
  mapModel._fetchCollection();

  if (!configModel.get('cartodb_com_hosted')) {
    if (currentUser.get('actions').builder_enabled && currentUser.get('show_builder_activated_message') &&
        _.isEmpty(dashboard_notifications)) {
      const userNotificationModel = new UserNotificationModel(dashboard_notifications, {
        key: 'dashboard',
        configModel: cdb.config
      });

      const dashboardNotification = new UserNotificationView({
        notification: userNotificationModel
      });

      window.dashboardNotification = dashboardNotification;
    }
  }

  // Why not have only one collection?
  const collection = new cdb.admin.Visualizations();

  const dashboard = new MainView({
    el: document.body,
    collection: collection,
    user: currentUser,
    config: config,
    router: router,
    assetsVersion: getAssetsVersion()
  });
  window.dashboard = dashboard;

  router.enableAfterMainView();

  // Event tracking "Visited Dashboard"
  cdb.god.trigger('metrics', 'visited_dashboard', {
    email: user_data.email
  });

  if (isJustLoggedIn) {
    // Event tracking "Logged in"
    cdb.god.trigger('metrics', 'logged_in', {
      email: user_data.email
    });
  }

  if (isFirstTimeViewingDashboard) {
    // Event tracking "Visited Dashboard for the first time"
    cdb.god.trigger('metrics', 'visited_dashboard_first_time', {
      email: user_data.email
    });
  }

  cdb.god.bind('openPrivacyDialog', function (vis) {
    if (vis.isOwnedByUser(currentUser) && currentUser.hasCreateDatasetsFeature()) {
      const dialog = new ChangePrivacyDialog({
        vis: vis,
        user: currentUser,
        enter_to_confirm: true,
        clean_on_hide: true
      });
      dialog.appendToBody();
    }
  });

  cdb.god.bind('openCreateDialog', function (dialog) {
    let createModel;
    dialog = dialog || {};
    if (dialog.type === 'dataset') {
      createModel = new CreateDatasetModel({}, {
        user: currentUser
      });
    } else {
      mapModel.setSelected(dialog.selectedItems);
      createModel = mapModel;
    }

    const createDialog = new CreateDialog({
      model: createModel,
      user: currentUser,
      clean_on_hide: true
    });

    createModel.bind('datasetCreated', function (tableMetadata) {
      let vis;

      if (router.model.isDatasets()) {
        vis = new cdb.admin.Visualization({ type: 'table' });
        vis.permission.owner = currentUser;
        vis.set('table', tableMetadata.toJSON());
        window.location = vis.viewUrl(currentUser).edit();
      } else {
        vis = new cdb.admin.Visualization({ name: DEFAULT_VIS_NAME });
        vis.save({
          tables: [ tableMetadata.get('id') ]
        }, {
          success: function (m) {
            window.location = vis.viewUrl(currentUser).edit();
          },
          error: function (e) {
            createDialog.close();
            collection.trigger('error');
          }
        });
      }
    }, this);

    createDialog.appendToBody();
    createModel.viewsReady();
  });
}

if (window.CartoConfig.data) {
  dataLoaded();
} else {
  const client = new CartoNode.AuthenticatedClient();

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
