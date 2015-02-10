var $ = require('jquery');
var cdb = require('cartodb.js');
var trackJsErrors = require('new_common/track_js_errors');
var MainView = require('new_keys/main_view');

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

    var currentUser = new cdb.admin.User(user_data);

    var keys = new MainView({
      el: document.body,
      user: currentUser,
      config: config
    });
    
    window.keys = keys;
  });

});
