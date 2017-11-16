var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var AssetsVersionHelper = require('../helpers/assets_version');
var EmbedMapMainView = require('./embed_map_main_view');
var UrlHelper = require('../helpers/url');
var PasswordProtectedView = require('../common/password_protected_view_static');

var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';
var PACKAGE = require('../../../../../package.json');
var VERSION = PACKAGE.version;

var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

$(function () {
  cdb.init(function () {
    var element = $('#app');
    var client = new Carto.AuthenticatedClient();

    var getPublicMapPageId = function () {
      var pathTokens = window.location.pathname.split('/');
      return pathTokens[pathTokens.length - 2];
    };

    function getAssetsBaseUrl () {
      var data = window.CartoConfig.data;
      var userAssetsHost = data.asset_host;

      return (window.StaticConfig.assetsBaseUrl || userAssetsHost && userAssetsHost + '/assets' || data.config.app_assets_base_url) + '/';
    }

    function isLogoHidden (viz, parameters) {
      // from visualizations controller
      return (!viz.has_logo && viz.remove_logo && (!parameters['cartodb_logo'] || parameters['cartodb_logo'] !== 'true')) ||
        (viz.has_logo && viz.remove_logo && (parameters['cartodb_logo'] === 'false'));
    }

    // function inlineCss (str) {
    //   var d = document;
    //   var s = d.createElement('style');
    //   s.innerHTML = str;
    //   var h = d.getElementsByTagName('head')[0];
    //   h.appendChild(s);
    // }

    // function inlineJs (str) {
    //   var d = document;
    //   var s = d.createElement('script');
    //   s.innerHTML = str;
    //   var h = d.getElementsByTagName('head')[0];
    //   h.appendChild(s);
    // }

    function showPasswordProtectedForm () {
      var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);
      var TITLE = _.template('<%- title %> | CARTO');
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
          if (window.CartoConfig.data && window.CartoConfig.vizdata) {
            showEmbedVisualization(password);
          } else if (!window.CartoConfig.vizdata) {
            getVisualization(password);
          }
        }
      });

      element.html(view.render().el);
    }

    function getVisualization (password) {
      var params = {
        show_permission: true,
        show_liked: true,
        show_stats: true,
        fetch_related_canonical_visualizations: true
      };

      if (password != null) {
        params = _.extend({}, params, {
          password: password
        });
      }

      var vizID = UrlHelper.getVizID();

      client.getVisualization(vizID, params, function (err, response, vizdata) {
        if (err && err.errors === 'Visualization not viewable') {
          showPasswordProtectedForm();
        } else {
          window.CartoConfig.vizdata = vizdata;
          showEmbedVisualization();
        }
      });
    }

    function showEmbedVisualization () {
      var data = window.CartoConfig.data;
      var viz = window.CartoConfig.vizdata;
      var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);

      var user_data = data.user_data;
      var config = data.config;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set('url_prefix', user_data.base_url);
      cdb.config.set(config); // import config

      var currentUser = new cdb.admin.User(
        _.extend(user_data, {
          logged_with_google: false,
          google_enabled: false
        })
      );

      var embedMapMainView = new EmbedMapMainView({ // eslint-disable-line
        el: document.body,
        user: currentUser,
        config: config,
        assetsVersion: assetsVersion
      });

      // this.inlineCssTemplate = cdb.templates.getTemplate('embed_map/views/embed_map_inline_css');

      // inlineCss(this.inlineCssTemplate({
      //   hideLogo: isLogoHidden(viz),
      //   removeLogo: viz.remove_logo,
      //   assetsUrl: getAssetsBaseUrl() + assetsVersion
      // }));

      // if (viz.map_provider === 'googlemaps') {
      //   var s = document.createElement('script');
      //   var t = document.getElementsByTagName('script')[0];
      //   s.async = false;
      //   s.src = '//maps.googleapis.com/maps/api/js?sensor=false&v=3.12&' + viz.google_maps_query_string;
      //   t.parentNode.insertBefore(s, t);
      // }

      // this.inlineJsTemplate = cdb.templates.getTemplate('embed_map/views/embed_map_inline_js');

      // // TODO
      // inlineJs(this.inlineJsTemplate({
      //   userPublicUrl: viz.url,
      //   passwordProtected: viz.password_protected,
      //   isPrivacyPrivate: viz.is_privacy_private,
      //   isDevelopment: true,
      //   hideLogo: isLogoHidden(viz),
      //   username: viz.username,
      //   visualizationsAddLikeUrl: viz.visualizations_add_like_url,
      //   vizId: viz.id,
      //   vizLikes: viz.likes,
      //   assetsUrl: getAssetsBaseUrl() + getAssetsVersion()
      // }));
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

    if (window.CartoConfig.data && window.CartoConfig.viz) {
      showEmbedVisualization();
    } else {
      getConfig();
    }
  });
});
