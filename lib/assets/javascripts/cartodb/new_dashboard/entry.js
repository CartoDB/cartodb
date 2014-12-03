var Router = require('new_dashboard/router');
var $ = require('jquery');
var cdb = require('cartodb.js');
var ErrorStats = require('new_dashboard/common/error_stats');
var MainView = require('new_dashboard/main_view');

/**
*  The Holy Dashboard
*/
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(config); // import config
    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    var router = new Router();

    // Mixpanel test
    if (window.mixpanel) {
      new cdb.common.Mixpanel({
        user: user_data,
        token: mixpanel_token
      });
    }

    // Store JS errors
    var errors = new ErrorStats({ user_data: user_data });

    // Main view
    var dashboard = new MainView({
      el:          document.body,
      user_data:   user_data,
      upgrade_url: upgrade_url,
      config:      config,
      router:      router
    });

    window.dashboard = dashboard;

    // History
    Backbone.history.start({
      pushState:  true,
      root:       cdb.config.prefixUrl() + '/dashboard/'
    });
  });

});
