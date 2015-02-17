var $ = require('jquery');
var cdb = require('cartodb.js');
var trackJsErrors = require('new_common/track_js_errors');
var HeaderView = require('new_common/views/dashboard_header_view');
var SupportView = require('new_common/support_view');
var HeaderViewModel = require('new_keys/header_view_model');
var LocalStorage = require('new_common/local_storage');
var urls = require('new_common/urls_fn');

if (window.trackJs) {
  trackJsErrors(window.trackJs, window.user_data.username);
}

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    cdb.config.set(window.config); // import config
    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var currentUser = new cdb.admin.User(window.user_data);

    var headerView = new HeaderView({
      el:             $('#header'), //pre-rendered in DOM by Rails app
      model:          currentUser,
      currentUserUrl: urls(window.config.account_host).userUrl(currentUser),
      viewModel:      new HeaderViewModel(),
      localStorage:   new LocalStorage()
    });
    headerView.render();

    var supportView = new SupportView({
      el: $('#support-banner'),
      user: currentUser
    });
    supportView.render();

    // TODO: replace .Form-copy => .js-copy-api-key
    $('.Form-copy').each(function() {
      // Copy
      $(this).zclip({
        path: cdb.config.get('assets_url') + "/flash/ZeroClipboard.swf",
        copy: function(){
          // TODO: replace with .js-input
          return $(this).parent().find(".Form-input").val();
        }
      });

      // Tooltip
      var tooltip = new cdb.common.TipsyTooltip({
        el: $(this),
        title: function() {
          return $(this).data('title');
        }
      });
    });
  });

});
