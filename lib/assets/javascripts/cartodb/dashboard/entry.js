var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var Router = require('./router');
var MainView = require('./main_view');
var sendUsageToMixpanel = require('./send_usage_to_mixpanel');
var ChangePrivacyDialog = require('../common/dialogs/change_privacy/change_privacy_view');
var CreateDialog = require('../common/dialogs/create/create_view');
var CreateDatasetModel = require('../common/dialogs/create/create_dataset_model');
var CreateMapModel = require('../common/dialogs/create/create_map_model');
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

    if (currentUser.featureEnabled('active_record_vis_endpoint')) {
      applyPatchNewVisualizationUrl();
    }
    if (currentUser.featureEnabled('active_record_geocoding_endpoint')) {
      applyPatchNewGeocodingUrls();
    }
    if (currentUser.featureEnabled('active_record_table_vis_endpoint')) {
      applyPatchNewTableUrls();
    }    
    if (currentUser.featureEnabled('active_record_layers_endpoint')) {
      applyPatchNewLayerUrls();
    }
    if (currentUser.featureEnabled('active_record_synchronization_endpoint')) {
      applyPatchNewSynchronizationUrls();
    }
    if (currentUser.featureEnabled('active_record_import_endpoint')) {
      applyPatchNewImportUrl();
    }
    if (currentUser.featureEnabled('active_record_asset_endpoint')) {
      applyPatchNewAssetUrl();
    }
    if (currentUser.featureEnabled('active_record_imports_service_endpoint')) {
      applyPatchNewImportsServiceUrl();
    }

    cdb.config.set('user', currentUser);
    var router = new Router({
      dashboardUrl: currentUser.viewUrl().dashboard()
    });

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

    // TODO: remove mixpanel
    if (window.mixpanel && window.mixpanel_token) {
      new cdb.admin.Mixpanel({
        user: window.user_data,
        token: window.mixpanel_token
      });
      sendUsageToMixpanel(window.mixpanel, currentUser, window.isFirstTimeViewingDashboard, window.isJustLoggedIn);
    }

    var metrics = new cdb.admin.Metrics();

    cdb.god.bind('openPrivacyDialog', function(vis) {
      if (vis.isOwnedByUser(currentUser)) {
        var dialog = new ChangePrivacyDialog({
          vis: vis,
          user: currentUser,
          enter_to_confirm: true,
          clean_on_hide: true
        });
        dialog.appendToBody();
      }
    });

    cdb.god.bind('openCreateDialog', function(d) {
      var createModel;
      if (d.type === 'dataset') {
        createModel = new CreateDatasetModel({}, {
          user: currentUser
        });
      } else {
        createModel = new CreateMapModel({}, _.extend({
          user: currentUser
        }, d));
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
              window.location = vis.viewUrl().edit();
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

// Event tracking "Visited dashboard"
cdb.god.trigger('metrics', 'visited_dashboard', {
  email: window.user_data.email,
  data: null
});
