var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var PublicMapWindow = require('./public_map_window_static');
var AssetsVersionHelper = require('../helpers/assets_version');
var MapOptionsHelper = require('../helpers/map_options');

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

      var currentUser = data.user_data
        ? new cdb.admin.User(data.user_data)
        : null;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set(data.config);

      if (currentUser) {
        cdb.config.set('user', currentUser);
        cdb.config.set('url_prefix', currentUser.get('base_url'));
      }

      this.publicMapView = new PublicMapWindow({
        assetsVersion: AssetsVersionHelper.getAssetsVersion(VERSION),
        collection: new cdb.admin.Visualizations(),
        config: cdb.config,
        currentUser: currentUser,
        data: data,
        el: window,
        mapId: MAP_ID,
        mapOptions: {},
        vizdata: vizdata,
        isMobileDevice: MapOptionsHelper.isMobileDevice()
      });
    }

    if (window.CartoConfig.data && window.CartoConfig.vizdata) {
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
              dataLoaded();
            }
          });
        }
      });
    }
  });
};

InitPublicMap();
