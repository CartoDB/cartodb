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
var MAP_ID = 'map';

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
        fetch_related_canonical_visualizations: false
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

    function showEmbedVisualization (password) {
      var data = window.CartoConfig.data;
      var vizdata = window.CartoConfig.vizdata;
      var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);

      var TITLE = _.template('<%- title %> | CARTO');
      document.title = TITLE({
        title: vizdata.name
      });

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

      var embedMapMainView = new EmbedMapMainView({ // eslint-disable-line
        el: '#app',
        mapId: MAP_ID,
        assetsVersion: assetsVersion,
        config: cdb.config,
        currentUser: currentUser,
        mapOwnerUser: mapOwnerUser,
        data: data,
        vizdata: vizdata,
        password: password
      });
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
