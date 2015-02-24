var $ = require('jquery');
var cdb = require('cartodb.js');
var Router = require('./router');
var MainView = require('./main_view');
var sendUsageToMixpanel = require('./send_usage_to_mixpanel');
var urls = require('../new_common/urls_fn');
var ChangePrivacyDialog = require('./dialogs/change_privacy_view');

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

    // TODO: This is still necessary implicitly, for the Backbone.sync method to work (set in app.js)
    //       once that case is removed we could skip cdb.config completely.
    cdb.config.set(window.config); // import config
    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    var currentUser = new cdb.admin.User(window.user_data);
    var currentUserUrl = urls(window.config.account_host).userUrl(currentUser);
    var router = new Router({
      currentUserUrl: currentUserUrl
    });

    var dashboard = new MainView({
      el: document.body,
      user: currentUser,
      config: window.config,
      router: router
    });
    window.dashboard = dashboard;

    router.enableAfterMainView();

    if (window.mixpanel && window.mixpanel_token) {
      new cdb.admin.Mixpanel({
        user: window.user_data,
        token: window.mixpanel_token
      });
      sendUsageToMixpanel(window.mixpanel, currentUser, window.isFirstTimeViewingDashboard, window.isJustLoggedIn);
    }

    cdb.god.bind('openPrivacyDialog', function(vis) {
      if (vis.isOwnedByUser(currentUser)) {
        var privacyDlg = new ChangePrivacyDialog({
          vis: vis,
          user: currentUser,
          upgradeUrl: currentUserUrl.toUpgradeAccount(),
          enter_to_confirm: true,
          clean_on_hide: true
        });
        privacyDlg.appendToBody();
      }
    });
  });

});
