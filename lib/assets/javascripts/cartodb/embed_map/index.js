var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var EmbedMapMainView = require('./embed_map_main_view');

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

      return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || cdb.config.get('assets_url').split('/assets/')[1];
    }

    function addStyleString (str) {
      var s = document.createElement('style');
      s.innerHTML = str;
      document.body.appendChild(s);
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
        assetsVersion: getAssetsVersion(),
        viz: viz
      });

      this.inlineCssTemplate = cdb.templates.getTemplate('embed_map/views/embed_map_inline_css');

      addStyleString(this.inlineCssTemplate({}));
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

          // TODO: get viz id from location
          client.getVisualization('a851ccf9-bd7c-423b-ba30-6de1ea5cdc8c', function (err, response, data) {
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
