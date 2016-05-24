var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var HeaderView = require('../common/views/dashboard_header_view');
var SupportView = require('../common/support_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var DeleteAccount = require('../common/delete_account_view');
var UpgradeMessage = require('../common/upgrade_message_view');
var AvatarSelector = require('../common/avatar_selector_view');
var GooglePlus = require('../common/google_plus');
var ServiceItem = require('./service_item_view');

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

    // Avatar
    if (this.$('.js-avatarSelector').length > 0) {
      var avatarSelector = new AvatarSelector({
        el: this.$('.js-avatarSelector'),
        renderModel: new cdb.core.Model({
          inputName: this.$('.js-fileAvatar').attr('name'),
          name: currentUser.get('name') || currentUser.get('username'),
          avatar_url: currentUser.get('avatar_url'),
          id: currentUser.get('id'),
        }),
        avatarAcceptedExtensions: window.avatar_valid_extensions
      });

      avatarSelector.render();
    }

    // User deletion
    if (this.$('.js-deleteAccount').length > 0 && window.authenticity_token) {
      this.$('.js-deleteAccount').click(function(ev) {
        if (ev) {
          ev.preventDefault();
        }
        new DeleteAccount({
          authenticityToken: window.authenticity_token,
          clean_on_hide: true,
          user: currentUser
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
      this.$('.js-confirmPassword').parent().after(googlePlus.render().el);
    }

    // Services items
    if (window.services_list && window.services_list.length > 0) {
      _.each(window.services_list, function(d, i) {
        var serviceItem = new ServiceItem({
          model: new cdb.core.Model(_.extend({ state: 'idle' }, d))
        });
        $('.js-datasourcesContent').after(serviceItem.render().el);
      });
    }
  });

});
