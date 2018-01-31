var Polyglot = require('node-polyglot');
var _ = require('underscore');
var $ = require('jquery');
require('./data/backbone/sync-options');

var Locale = require('../locale/index');
var AuthenticatedUser = require('./data/authenticated-user-model');
var UserModel = require('./data/user-model');
var ConfigModel = require('./data/config-model');
var UserSettingsView = require('./components/navbar/user-settings-view');
var UserIndustriesView = require('./components/navbar/user-industries-view');
var ScrollToFix = require('./util/scroll-tofixed-view');
var FavMapView = require('./views/public-profile/fav-map-view');
var Feed = require('./views/public-profile/feed-view');

var ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.base_url
    },
    window.config
  )
);

$(function () {
  var scrollableHeader = new ScrollToFix({ // eslint-disable-line
    el: $('.js-Navmenu')
  });

  var authenticatedUser = new AuthenticatedUser();

  authenticatedUser.on('change', function (model) {
    if (model.get('username')) {
      var user = new UserModel(authenticatedUser.attributes, {
        configModel: configModel
      });

      var userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: user
      });
      userSettingsView.render();
    }
  });

  authenticatedUser.fetch();

  var userIndustriesView = new UserIndustriesView({ // eslint-disable-line
    el: $('.js-user-industries')
  });

  var favMapView = new FavMapView(window.favMapViewAttrs);
  favMapView.render();

  var feed = new Feed({
    el: $('.js-feed'),
    config: configModel,
    authenticatedUser: authenticatedUser
  });

  feed.render();
});
