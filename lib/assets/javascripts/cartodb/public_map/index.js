var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var AssetsVersionHelper = require('../helpers/assets_version');
var MapOptionsHelper = require('../helpers/map_options');
var UrlHelper = require('../helpers/url');
var PublicMapWindow = require('./public_map_window_static');
var StaticHeaderMetaTagsHelper = require('../helpers/static_header_meta_tags');

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

var InitPublicMap = function () {
  cdb.init(function () {
    var TWITTER_CARD_IMG_WIDTH = 560;
    var TWITTER_CARD_IMG_HEIGHT = 300;
    var FACEBOOK_CARD_IMG_WIDTH = 1200;
    var FACEBOOK_CARD_IMG_HEIGHT = 630;

    function dataLoaded () {
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

      this.publicMapView = new PublicMapWindow({
        assetsVersion: assetsVersion,
        collection: new cdb.admin.Visualizations(),
        config: cdb.config,
        currentUser: currentUser,
        mapOwnerUser: mapOwnerUser,
        data: data,
        el: '#app',
        isMobileDevice: MapOptionsHelper.isMobileDevice(),
        mapId: MAP_ID,
        mapOptions: {},
        vizdata: vizdata,
        visualizations: visualizations
      });
    }

    if (window.CartoConfig.data && window.CartoConfig.vizdata) {
      dataLoaded();
    } else {
      var client = new Carto.AuthenticatedClient();
      var visualizationsNumber = 3;

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

      var getVisualization = function () {
        var params = {
          show_permission: true,
          show_liked: true,
          show_stats: true,
          // privacy: 'PUBLIC',
          fetch_related_canonical_visualizations: true
        };

        var vizID = UrlHelper.getVizID();

        client.getVisualization(vizID, params, function (err, response, vizdata) {
          if (err) {
            console.error(err);
            return err;
          } else {
            window.CartoConfig.vizdata = vizdata;
            getDerivedVisualizations(vizdata);
          }
        });
      };

      var getDerivedVisualizations = function (vizdata) {
        client.getDerivedVisualizations(visualizationsNumber, function (err, response, data) {
          if (err) {
            console.error(err);
            return err;
          } else {
            window.CartoConfig.visualizations = data.visualizations;
            dataLoaded();
          }
        });
      };
    }

    getConfig();
  });
};

InitPublicMap();
