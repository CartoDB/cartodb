var Router = require('new_dashboard/router');
var $ = require('jquery');
var cdb = require('cartodb.js');
var MainView = require('new_dashboard/main_view');
var trackJsErrors = require('new_common/track_js_errors');
var sendUsageToMixpanel = require('./send_usage_to_mixpanel');

if (window.trackJs) {
  trackJsErrors(window.trackJs, window.user_data.username);
}

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config); // import config
    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    var navigation = new cdb.admin.Navigation({
      upgrade_url: upgrade_url
    }, {
      config: cdb.config
    });
    var router = new Router();
    var user = new cdb.admin.User(user_data);

    // Main view
    var dashboard = new MainView({
      el:          document.body,
      user:        user,
      config:      config,
      router:      router,
      navigation:  navigation
    });

    window.dashboard = dashboard;

    // History
    Backbone.history.start({
      pushState:  true,
      root:       cdb.config.prefixUrl() + '/' //cdb.config.prefixUrl() + '/dashboard/'
    });

    if (window.mixpanel && window.mixpanel_token) {
      new cdb.common.Mixpanel({
        user: user_data,
        token: window.mixpanel_token
      });
      sendUsageToMixpanel(window.mixpanel, user, window.isFirstTimeViewingDashboard, window.isJustLoggedIn);
    };
  });

});
