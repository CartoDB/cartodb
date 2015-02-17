var $ = require('jquery');
var cdb = require('cartodb.js');
var trackJsErrors = require('new_common/track_js_errors');
// var HeaderView = require('nnew_common/header_viewew');
var SupportView = require('new_common/support_view');

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

    var user = new cdb.admin.User(user_data);

    // var headerView = new HeaderView({
    //   el:         this.$('#header'), //pre-rendered in DOM by Rails app
    //   model:      this.user,
    //   router:     this.router,
    //   localStorage: this.localStorage
    // });
    // headerView.render();

    var supportView = new SupportView({
      el: $('#support-banner'),
      user: user
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
