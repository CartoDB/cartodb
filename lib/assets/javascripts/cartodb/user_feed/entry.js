var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js');
var UserSettingsView = require('../public_common/user_settings_view');
var UserTourView = require('../public_common/user_tour_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var UserResourcesView = require('../public_common/user_resources_view');
var UserDiscoverView = require('../public_common/user_discover_view');
var FavMapView = require('../public_dashboard/fav_map_view');
var Feed = require('./view');
var ScrollableHeader = require('../common/views/scrollable_header');

/**
 * Entry point for the user feed, bootstraps all dependency models and application.
 */
$(function() {

  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config);
    cdb.config.set('url_prefix', window.base_url);

    var userTourView = new UserTourView({
      el: $('.js-user-tour')
    });

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries')
    });

    var userResourcesView = new UserResourcesView({
      el: $('.js-user-resources')
    });

    var userDiscoverView = new UserDiscoverView({
      el: $('.js-user-discover')
    });

    var scrollableHeader = new ScrollableHeader({
      el: $('.js-Navmenu'),
      anchorPoint: 520
    });

    var authenticatedUser = new cdb.open.AuthenticatedUser();

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    authenticatedUser.bind('change', function() {
      if (authenticatedUser.get('username')) {
        var user = new cdb.admin.User(authenticatedUser.attributes);
        var userSettingsView = new UserSettingsView({
          el: $('.js-user-settings'),
          model: user
        });
        userSettingsView.render();

        var userDashboardUrl = user.viewUrl().dashboard();
        $('.js-user-info .UserAvatar-img').wrap($('<a>', {
          href: userDashboardUrl
        }));

        $('.js-login').hide();
        $('.js-learn').show();
      }
    });

    var favMapView = new FavMapView(window.favMapViewAttrs);
    favMapView.render();

    var feed = new Feed({
      el: $('.js-feed'),
      authenticatedUser: authenticatedUser
    });

    feed.render();
    authenticatedUser.fetch();
  });
});
