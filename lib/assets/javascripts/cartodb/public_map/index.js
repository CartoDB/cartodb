var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var PublicMapView = require('./public_map_view_static');
var AssetsVersionHelper = require('../helpers/assets_version');
var UrlParamsHelper = require('../helpers/url_params');

var PACKAGE = require('../../../../../package.json');
var VERSION = PACKAGE.version;
var MAP_ID = 'map';

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

var InitPublicMap = function () {
  cdb.init(function () {
    function dataLoaded () {
      var data = window.CartoConfig.data;
      var vizdata = window.CartoConfig.vizdata;
      var config = data.config;
      var userData = data.user_data;
      var currentUser = userData
        ? new cdb.admin.User(userData)
        : null;

      cdb.templates.namespace = 'cartodb/';

      if (currentUser) {
        cdb.config.set(config);
        cdb.config.set('url_prefix', userData.base_url);
        cdb.config.set('user', currentUser);
      }

      this.publicMapView = new PublicMapView({
        assetsVersion: AssetsVersionHelper.getAssetsVersion(VERSION),
        collection: new cdb.admin.Visualizations(),
        config: config,
        currentUser: currentUser,
        el: document.body,
        isHosted: cdb.config.get('cartodb_com_hosted'),
        mapId: MAP_ID,
        mapOptions: UrlParamsHelper.getMapOptions(),
        vizdata: vizdata
      });
    }

    if (window.CartoConfig.data && window.CartoConfig.vizdata && window.CartoConfig.mapOptions) {
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
          var viz = url.substring(url.indexOf(vizStr) + vizStr.length, url.indexOf('/public_map'));

          client.getVisualization(viz, function (err, response, data) {
            if (err) {
              console.error(err);
              return err;
            } else {
              window.CartoConfig.vizdata = data;
              window.CartoConfig.mapOptions = {};
              dataLoaded();
            }
          });
        }
      });
    }
  });
};

InitPublicMap();
