var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/views/dashboard_header_view');
var SupportView = require('../common/support_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var RegenerateKeysDialog = require('./regenerate_keys_dialog_view');
var UpgradeMessage = require('../common/upgrade_message_view');

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', user_data.base_url);

    cdb.config.set(window.config); // import config

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var currentUser = new cdb.admin.User(window.user_data);

    var headerView = new HeaderView({
      el:             $('#header'), //pre-rendered in DOM by Rails app
      model:          currentUser,
      viewModel:      new HeaderViewModel(),
      localStorage:   new LocalStorage()
    });
    headerView.render();

    var upgradeMessage = new UpgradeMessage({
      model: currentUser
    });

    $('.Header').after(upgradeMessage.render().el);

    var supportView = new SupportView({
      el: $('#support-banner'),
      user: currentUser
    });
    supportView.render();

    $('.js-regenerateApiKey').bind('click', function(ev) {
      if (ev) ev.preventDefault();
      var action = currentUser.get('base_url') + '/your_apps/api_key/regenerate';
      var authenticity_token = $('[name=authenticity_token][value]').get(0).value;
      var dlg = new RegenerateKeysDialog({
        type: 'api',
        scope: 'user',
        mobile_enabled: window.mobile_enabled,
        form_action: action,
        authenticity_token: authenticity_token
      });

      dlg.appendToBody();
    });

    $('.js-regenerateOauth').bind('click', function(ev) {
      if (ev) ev.preventDefault();
      var action = currentUser.get('base_url') + '/your_apps/oauth/regenerate';
      var authenticity_token = $('[name=authenticity_token][value]').get(0).value;
      var dlg = new RegenerateKeysDialog({
        type: 'oauth',
        scope: 'user',
        form_action: action,
        authenticity_token: authenticity_token,
        method: 'delete'
      });

      dlg.appendToBody();
    });
  });
});
