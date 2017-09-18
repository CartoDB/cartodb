var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var EmbedMapMainView = require('./embed_map_main_view');
var PACKAGE = require('../../../../../package.json');
var version = PACKAGE.version;

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

/**
 * Entry point for embed_map
 */
$(function () {
  cdb.init(function () {
    function getAssetsVersion () {
      var query = window.location.search.substring(1);
      var vars = query.split('&');

      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');

        if (pair[0] === 'v') {
          return pair[1];
        }
      }

      return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || version;
    }

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

    function inlineCss (str) {
      var d = document;
      var s = d.createElement('style');
      s.innerHTML = str;
      var h = d.getElementsByTagName('head')[0];
      h.appendChild(s);
    }

    function inlineJs (str) {
      var d = document;
      var s = d.createElement('script');
      s.innerHTML = str;
      var h = d.getElementsByTagName('head')[0];
      h.appendChild(s);
    }

    function dataLoaded () {
      var data = window.CartoConfig.data;
      var viz = window.CartoConfig.viz;

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
        assetsVersion: getAssetsVersion()
      });

      this.inlineCssTemplate = cdb.templates.getTemplate('embed_map/views/embed_map_inline_css');

      inlineCss(this.inlineCssTemplate({
        hideLogo: isLogoHidden(viz),
        removeLogo: viz.remove_logo,
        assetsUrl: getAssetsBaseUrl() + getAssetsVersion()
      }));

      if (viz.map_provider === 'googlemaps') {
        var s = document.createElement('script');
        var t = document.getElementsByTagName('script')[0];
        s.async = false;
        s.src = '//maps.googleapis.com/maps/api/js?sensor=false&v=3.12&' + viz.google_maps_query_string;
        t.parentNode.insertBefore(s, t);
      }

      this.inlineJsTemplate = cdb.templates.getTemplate('embed_map/views/embed_map_inline_js');

      // TODO
      inlineJs(this.inlineJsTemplate({
        userPublicUrl: viz.url,
        passwordProtected: viz.password_protected,
        isPrivacyPrivate: viz.is_privacy_private,
        isDevelopment: true,
        hideLogo: isLogoHidden(viz),
        username: viz.username,
        visualizationsAddLikeUrl: viz.visualizations_add_like_url,
        vizId: viz.id,
        vizLikes: viz.likes,
        assetsUrl: getAssetsBaseUrl() + getAssetsVersion()
      }));
    }

    if (window.CartoConfig.data && window.CartoConfig.viz) {
      dataLoaded();
    } else {
      var client = new Carto.AuthenticatedClient();

      client.getConfig(function (err, response, data) {
        if (err) {
          console.error(err);

          return err;
        } else {
          window.CartoConfig.data = data;

          var url = window.location.pathname;
          var vizStr = '/viz/';
          var viz = url.substring(url.indexOf(vizStr) + vizStr.length, url.indexOf('/embed_map'));

          client.getVisualization(viz, function (err, response, data) {
            if (err) {
              console.error(err);

              return err;
            } else {
              window.CartoConfig.viz = data;

              dataLoaded();
            }
          });
        }
      });
    }
  });
});
