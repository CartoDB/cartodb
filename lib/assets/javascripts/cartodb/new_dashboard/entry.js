var Router = require('new_dashboard/router');
var $ = require('jquery');
var cdb = require('cartodb.js');
var MainView = require('new_dashboard/main_view');
var trackJsErrors = require('new_common/track_js_errors');

/**
*  The Holy Dashboard
*/
$(function() {

  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config); // import config
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

    var user = new cdb.admin.User(user_data);

    trackJsErrors(user);

    var navigation = new cdb.admin.Navigation({
      upgrade_url: upgrade_url
    }, {
      config: cdb.config
    });

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
  });

});
