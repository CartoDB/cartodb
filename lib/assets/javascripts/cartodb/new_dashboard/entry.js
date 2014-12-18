var Router = require('new_dashboard/router');
var $ = require('jquery');
var cdb = require('cartodb.js');
var MainView = require('new_dashboard/main_view');
var trackJsErrors = require('new_common/track_js_errors');
var sendUsageToMixpanel = require('./send_usage_to_mixpanel');
var UserUrlsModel = require('new_dashboard/user_urls_model');

if (window.trackJs) {
  trackJsErrors(window.trackJs, window.user_data.username);
}

/**
 * Entry point for the new dashboard, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config); // import config
    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    var userUrls = new UserUrlsModel({
      upgrade_url: upgrade_url
    }, {
      config: cdb.config
    });
    var router = new Router({
      rootUrl: cdb.config.prefixUrl()
    });
    var user = new cdb.admin.User(user_data);

    var dashboard = new MainView({
      el:          document.body,
      user:        user,
      config:      config,
      router:      router,
      userUrls:    userUrls
    });

    window.dashboard = dashboard;

    router.enableAfterMainView();

    if (window.mixpanel && window.mixpanel_token) {
      new cdb.admin.Mixpanel({
        user: user_data,
        token: window.mixpanel_token
      });
      sendUsageToMixpanel(window.mixpanel, user, window.isFirstTimeViewingDashboard, window.isJustLoggedIn);
    };
  });

});
