const Polyglot = require('node-polyglot');
const _ = require('underscore');
const $ = require('jquery');
require('dashboard/data/backbone/sync-options');

const Locale = require('../locale/index');
const AuthenticatedUser = require('dashboard/data/authenticated-user-model');
const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');
const UserSettingsView = require('dashboard/components/navbar/user-settings-view');
const UserIndustriesView = require('dashboard/components/navbar/user-industries-view');
const ScrollToFix = require('dashboard/helpers/scroll-tofixed-view');
const FavMapView = require('dashboard/views/public-profile/fav-map-view');
const Feed = require('dashboard/views/public-profile/feed-view');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v');

const configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.base_url
    },
    window.config
  )
);

$(function () {
  new ScrollToFix({ // eslint-disable-line no-new
    el: $('.js-Navmenu')
  });

  const authenticatedUser = new AuthenticatedUser();

  authenticatedUser.on('change', function (model) {
    if (model.get('username')) {
      NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction(model.get('username')));
      NetworkResponseInterceptor.start();

      var user = new UserModel(authenticatedUser.attributes, {
        configModel: configModel
      });

      const userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: user
      });
      userSettingsView.render();
    }
  });

  authenticatedUser.fetch();

  new UserIndustriesView({ // eslint-disable-line no-new
    el: $('.js-user-industries')
  });

  const favMapView = new FavMapView(window.favMapViewAttrs);
  favMapView.render();

  const feed = new Feed({
    el: $('.js-feed'),
    config: configModel,
    authenticatedUser: authenticatedUser
  });

  feed.render();
});
