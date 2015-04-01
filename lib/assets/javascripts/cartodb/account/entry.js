var $ = require('jquery');
var cdb = require('cartodb.js');
var HeaderView = require('../new_common/views/dashboard_header_view');
var SupportView = require('../new_common/support_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../new_common/local_storage');
var DeleteAccount = require('../new_common/delete_account_view');
var UpgradeMessage = require('../new_common/upgrade_message_view');
var GooglePlus = require('../new_common/google_plus');

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

    cdb.config.set(window.config); // import config

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var currentUser = window.currentUser = new cdb.admin.User(
      _.extend(
        window.user_data,
        {
          can_change_email: can_change_email,
          logged_with_google: false,
          google_enabled: false
        }
      )
    );

    var headerView = new HeaderView({
      el:             $('#header'), //pre-rendered in DOM by Rails app
      model:          currentUser,
      viewModel:      new HeaderViewModel(),
      localStorage:   new LocalStorage()
    });
    headerView.render();

    var supportView = new SupportView({
      el: $('#support-banner'),
      user: currentUser
    });
    supportView.render();

    var upgradeMessage = new UpgradeMessage({
      model: currentUser
    });

    $('.Header').after(upgradeMessage.render().el);

    // File input style
    if (this.$(':file').length > 0) {
      var self = this;
      this.$(":file").filestyle({
        buttonText: "Choose avatar"
      });
      this.$(":file").bind('change', function() {
        self.$('.form-control').show();
        self.$('.btn').hide();
      });
    }

    // User deletion
    if (this.$('.js-deleteAccount').length > 0 && window.authenticity_token) {
      this.$('.js-deleteAccount').click(function(ev) {
        if (ev) {
          ev.preventDefault();
        }
        new DeleteAccount({
          authenticityToken: window.authenticity_token,
          clean_on_hide: true
        }).appendToBody();
      })  
    }

    // Google + behaviour!
    // If iframe is not present, we can't do anything
    if (window.iframe_src) {
      var googlePlus = new GooglePlus({
        model: currentUser,
        iframeSrc: iframe_src
      });

      googlePlus.hide();
      this.$('.Form-footer').before(googlePlus.render().el);
    }
  });

});
