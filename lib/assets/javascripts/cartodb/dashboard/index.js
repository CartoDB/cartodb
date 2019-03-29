var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

var Router = require('./router');
var MainView = require('./main_view_static');
var ChangePrivacyDialog = require('../common/dialogs/change_privacy/change_privacy_view');
var CreateDialog = require('../common/dialogs/create/create_view');
var CreateDatasetModel = require('../common/dialogs/create/create_dataset_model');
var CreateMapModel = require('../common/dialogs/create/create_map_model');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');
var DEFAULT_VIS_NAME = 'Untitled map';

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

/**
 * Entry point for the new dashboard, bootstraps all dependency models and application.
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
      var default_fallback_basemap = data.default_fallback_basemap;
      var config = data.config;
      var dashboard_notifications = data.dashboard_notifications;
      var isJustLoggedIn = data.isJustLoggedIn;
      var isFirstTimeViewingDashboard = data.isFirstTimeViewingDashboard;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set('url_prefix', user_data.base_url);
      cdb.config.set('default_fallback_basemap', default_fallback_basemap);

      // TODO: This is still necessary implicitly, for the Backbone.sync method to work (set in app.js)
      //       once that case is removed we could skip cdb.config completely.
      cdb.config.set(config); // import config

      var currentUser = new cdb.admin.User(user_data);

      document.title = currentUser.get('username') + ' | CARTO';

      cdb.config.set('user', currentUser);

      var router = new Router({
        dashboardUrl: currentUser.viewUrl().dashboard()
      });

      var mapModel = new CreateMapModel({}, {
        user: currentUser
      });
      mapModel._fetchCollection();

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

      // Why not have only one collection?
      var collection = new cdb.admin.Visualizations();

      var dashboard = new MainView({
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
          var dialog = new ChangePrivacyDialog({
            vis: vis,
            user: currentUser,
            enter_to_confirm: true,
            clean_on_hide: true
          });
          dialog.appendToBody();
        }
      });

      cdb.god.bind('openCreateDialog', function (dialog) {
        var createModel;
        dialog = dialog || {};
        if (dialog.type === 'dataset') {
          createModel = new CreateDatasetModel({}, {
            user: currentUser
          });
        } else {
          mapModel.setSelected(dialog.selectedItems);
          createModel = mapModel;
        }

        var createDialog = new CreateDialog({
          model: createModel,
          user: currentUser,
          clean_on_hide: true
        });

        createModel.bind('datasetCreated', function (tableMetadata) {
          var vis;

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
      var client = new CartoNode.AuthenticatedClient();

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
