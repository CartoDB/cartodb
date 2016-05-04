var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var HeaderView = require('../common/views/dashboard_header_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var IconSelector = require('../common/icon_selector_view');

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

    var currentUser = window.currentUser = new cdb.admin.User(window.user_data);

    var headerView = new HeaderView({
      el:             $('#header'), //pre-rendered in DOM by Rails app
      model:          currentUser,
      viewModel:      new HeaderViewModel(),
      localStorage:   new LocalStorage()
    });
    headerView.render();

    // Avatar
    if (this.$('.js-iconSelector').length > 0) {
      var iconSelector = new IconSelector({
        el: this.$('.js-iconSelector'),
        renderModel: new cdb.core.Model({
          id: currentUser.get('id'),
          name: window.mobile_app_name,
          inputName: this.$('.js-fileIcon').attr('name'),
          icon_url: window.mobile_app_icon
        }),
        iconAcceptedExtensions: window.icon_valid_extensions
      });

      iconSelector.render();
    }

  });

});
