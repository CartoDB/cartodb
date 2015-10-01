var $ = require('jquery');
var cdb = require('cartodb.js');
var UserInfoView = require('../public_dashboard/user_info_view');
var UserSettingsView = require('../public_common/user_settings_view');
var UserTourView = require('../public_common/user_tour_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var UserResourcesView = require('../public_common/user_resources_view');
var MapCardPreview = require('../common/views/mapcard_preview');
var DataLibrary = require('./data_library_view');

/**
 * Entry point for data-library index
 */
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config);
    cdb.config.set('data_library_user', window.config.explore_user);
    cdb.config.set('url_prefix', window.base_url);

    var userTourView = new UserTourView({
      el: $('.js-user-tour'),
    });

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries'),
    });

    var userResourcesView = new UserResourcesView({
      el: $('.js-user-resources'),
    });

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    var authenticatedUser = new cdb.open.AuthenticatedUser();
    authenticatedUser.bind('change', function() {
      if (authenticatedUser.get('username')) {
        var user = new cdb.admin.User(authenticatedUser.attributes);
        var userSettingsView = new UserSettingsView({
          el: $('.js-user-settings'),
          model: user
        });
        userSettingsView.render();

        var userDashboardUrl = user.viewUrl().dashboard();
        $('.UserAvatar-img').wrap($('<a>',{
           href: userDashboardUrl
        }));

        $('.js-login').hide();
        $('.js-learn').show();
      }
    });

    var userInfoView = new UserInfoView({
      el: $('.js-user-info')
    });
    userInfoView.render();

    var data_library = new DataLibrary({
      el: $('.js-data_library'),
      authenticatedUser: authenticatedUser
    });

    data_library.render();

    authenticatedUser.fetch();
  });
});
