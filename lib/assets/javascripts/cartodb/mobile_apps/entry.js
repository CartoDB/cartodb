var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/views/dashboard_header_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var IconSelector = require('../common/icon_selector_view');
var DeleteMobileApp = require('./delete_mobile_app_view');
var AppPlatformsLegends = require('./app_platforms_legends');

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function () {
  cdb.init(function () {
    cdb.templates.namespace = 'cartodb/';

    cdb.config.set('url_prefix', window.user_data.base_url);
    cdb.config.set(window.config); // import config

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var currentUser = window.currentUser = new cdb.admin.User(window.user_data);
    var mobileApp = window.mobile_app_data;

    var headerView = new HeaderView({
      el: $('#header'), // pre-rendered in DOM by Rails app
      model: currentUser,
      viewModel: new HeaderViewModel(),
      localStorage: new LocalStorage()
    });
    headerView.render();

    // Avatar
    if (this.$('.js-iconSelector').length > 0) {
      var iconSelector = new IconSelector({
        el: this.$('.js-iconSelector'),
        renderModel: new cdb.core.Model({
          id: currentUser.get('id'),
          name: mobileApp.name,
          inputName: this.$('.js-fileIcon').attr('name'),
          icon_url: mobileApp.icon_url
        }),
        iconAcceptedExtensions: window.icon_valid_extensions
      });

      iconSelector.render();
    }

    // Mobile app deletion
    if (this.$('.js-deleteMobileApp').length > 0) {
      this.$('.js-deleteMobileApp').click(function (ev) {
        if (ev) {
          ev.preventDefault();
        }
        new DeleteMobileApp({
          authenticityToken: window.authenticity_token,
          mobileApp: mobileApp,
          clean_on_hide: true
        }).appendToBody();
      });
    }

    if (this.$('.js-appPlatformsLegend').length > 0) {
      new AppPlatformsLegends({
        el: this.$('.js-MobileAppForm'),
        app_platforms: mobileApp['mobile_platforms']
      }).appendToBody();
    }
  });
});
