var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var AssetsVersionHelper = require('../helpers/assets_version');
var MapOptionsHelper = require('../helpers/map_options');
var UrlHelper = require('../helpers/url');
var PublicMapWindow = require('./public_map_window_static');
var StaticHeaderMetaTagsHelper = require('../helpers/static_header_meta_tags');
var PasswordProtectedView = require('../common/password_protected_view_static');
var ForbiddenView = require('../common/forbidden_static_view');

var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';
var PACKAGE = require('../../../../../package.json');
var VERSION = PACKAGE.version;
var MAP_ID = 'map';

var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

var client = new CartoNode.AuthenticatedClient();

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

var TITLE = _.template('<%- title %> | CARTO');

var getPublicMapPageId = function () {
  var pathTokens = window.location.pathname.split('/');
  return pathTokens[pathTokens.length - 2];
};

var TWITTER_CARD_IMG_WIDTH = 560;
var TWITTER_CARD_IMG_HEIGHT = 300;
var FACEBOOK_CARD_IMG_WIDTH = 1200;
var FACEBOOK_CARD_IMG_HEIGHT = 630;
var element = $('#app');

$(function () {
  cdb.init(function () {
    function showPasswordProtectedForm () {
      var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);
      var data = window.CartoConfig.data;
      var config = data.config;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set(config);

      document.title = TITLE({
        title: _t('protected_map.title')
      });

      var view = new PasswordProtectedView({
        vizID: getPublicMapPageId(),
        data: data,
        assetsVersion: assetsVersion,
        handleRedirection: function (password) {
          getVisualization(password);
        }
      });

      element.html(view.render().el);
    }

    function showForbiddenView () {
      var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);
      var data = window.CartoConfig.data;
      var config = data.config;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set(config);
      document.title = TITLE({
        title: _t('forbidden_map.title')
      });

      var view = new ForbiddenView({
        data: data,
        assetsVersion: assetsVersion
      });

      element.html(view.render().el);
    }

    function getVisualization (password) {
      var params = {
        show_permission: true,
        show_liked: true,
        show_stats: true,
        fetch_user: true,
        fetch_related_canonical_visualizations: true
      };

      if (password != null) {
        params = _.extend({}, params, {
          password: password
        });
      }

      var vizID = UrlHelper.getVizID();

      client.getVisualization(vizID, params, function (err, response, data) {
        var error;
        if (err) {
          error = data.responseJSON;
        }

        if (err && error.errors_cause && error.errors_cause === 'privacy_password') {
          showPasswordProtectedForm();
        } else if (err && error.errors === 'Visualization not viewable') {
          showForbiddenView();
        } else {
          window.CartoConfig.vizdata = data;
          getDerivedVisualizations(data, password);
        }
      });
    }

    function getDerivedVisualizations (vizdata, password) {
      var visualizationsNumber = 3;

      var options = {
        per_page: visualizationsNumber,
        password: password
      };

      client.getDerivedVisualizations(options, function (err, response, data) {
        if (err) {
          console.error(err);
          return err;
        } else {
          window.CartoConfig.visualizations = data.visualizations;
          showPublicVisualization(password);
        }
      });
    }

    function showPublicVisualization (password) {
      var data = window.CartoConfig.data;
      var vizdata = window.CartoConfig.vizdata;
      var visualizations = window.CartoConfig.visualizations;
      var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);
      var assetsBaseUrl = data.config.app_assets_base_url;
      var currentUser = data.user_data
        ? new cdb.admin.User(data.user_data)
        : null;

      var mapOwnerUser = vizdata.permission.owner
        ? new cdb.admin.User(vizdata.permission.owner)
        : null;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set(data.config);

      if (currentUser) {
        cdb.config.set('user', currentUser);
        cdb.config.set('url_prefix', currentUser.get('base_url'));
      }

      StaticHeaderMetaTagsHelper
        .addPublicMapMeta(assetsBaseUrl, vizdata, mapOwnerUser)
        .addTwitterMeta(vizdata, mapOwnerUser, TWITTER_CARD_IMG_WIDTH, TWITTER_CARD_IMG_HEIGHT)
        .addFacebookMeta(vizdata, mapOwnerUser, FACEBOOK_CARD_IMG_WIDTH, FACEBOOK_CARD_IMG_HEIGHT);

      $('#app').empty();

      var publicMapView = new PublicMapWindow({
        el: '#app',
        assetsVersion: assetsVersion,
        collection: new cdb.admin.Visualizations(),
        config: cdb.config,
        currentUser: currentUser,
        mapOwnerUser: mapOwnerUser,
        data: data,
        isMobileDevice: MapOptionsHelper.isMobileDevice(),
        mapId: MAP_ID,
        mapOptions: {},
        vizdata: vizdata,
        visualizations: visualizations,
        password: password
      });

      publicMapView.render();
    }

    var getConfig = function () {
      client.getConfig(function (err, response, data) {
        if (err) {
          console.error(err);
          return err;
        } else {
          window.CartoConfig.data = data;
          getVisualization();
        }
      });
    };

    getConfig();
  });
});
