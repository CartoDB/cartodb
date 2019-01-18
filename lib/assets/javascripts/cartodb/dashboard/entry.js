var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Router = require('./router');
var MainView = require('./main_view');
var ChangePrivacyDialog = require('../common/dialogs/change_privacy/change_privacy_view');
var CreateDialog = require('../common/dialogs/create/create_view');
var CreateDatasetModel = require('../common/dialogs/create/create_dataset_model');
var CreateMapModel = require('../common/dialogs/create/create_map_model');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');
var DEFAULT_VIS_NAME = 'Untitled map';

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 * Entry point for the new dashboard, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', user_data.base_url);
    cdb.config.set('default_fallback_basemap', window.default_fallback_basemap);

    // TODO: This is still necessary implicitly, for the Backbone.sync method to work (set in app.js)
    //       once that case is removed we could skip cdb.config completely.
    cdb.config.set(window.config); // import config

    var currentUser = new cdb.admin.User(window.user_data);

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

    // Why not have only one collection?
    var collection =  new cdb.admin.Visualizations();

    var dashboard = new MainView({
      el: document.body,
      collection: collection,
      user: currentUser,
      config: window.config,
      router: router
    });
    window.dashboard = dashboard;

    router.enableAfterMainView();

    var metrics = new cdb.admin.Metrics();

    // Event tracking "Visited Dashboard"
    cdb.god.trigger('metrics', 'visited_dashboard', {
      email: window.user_data.email
    });

    if (window.isJustLoggedIn) {
      // Event tracking "Logged in"
      cdb.god.trigger('metrics', 'logged_in', {
        email: window.user_data.email
      });
    }

    if (window.isFirstTimeViewingDashboard) {
      // Event tracking "Visited Dashboard for the first time"
      cdb.god.trigger('metrics', 'visited_dashboard_first_time', {
        email: window.user_data.email
      });
    }

    cdb.god.bind('openPrivacyDialog', function(vis) {
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

    cdb.god.bind('openCreateDialog', function(dialog) {
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

      createModel.bind('datasetCreated', function(tableMetadata) {
        if (router.model.isDatasets()) {
          var vis = new cdb.admin.Visualization({ type: 'table' });
          vis.permission.owner = currentUser;
          vis.set('table', tableMetadata.toJSON());
          window.location = vis.viewUrl(currentUser).edit();
        } else {
          var vis = new cdb.admin.Visualization({ name: DEFAULT_VIS_NAME });
          vis.save({
            tables: [ tableMetadata.get('id') ]
          },{
            success: function(m) {
              window.location = vis.viewUrl(currentUser).edit();
            },
            error: function(e) {
              createDialog.close();
              collection.trigger('error');
            }
          });
        }
      }, this);

      createDialog.appendToBody();
      createModel.viewsReady();
    });
  });
});
