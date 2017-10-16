var _ = require('underscore');
var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var AssetsVersionHelper = require('../helpers/assets_version');
var MapOptionsHelper = require('../helpers/map_options');
var PublicMapWindow = require('./public_map_window_static');

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
      var visualizations = window.CartoConfig.visualizations;

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

      this.publicMapView = new PublicMapWindow({
        assetsVersion: AssetsVersionHelper.getAssetsVersion(VERSION),
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
      var vizUrl = MapOptionsHelper.getVizUrl('public_map');
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
      }

      var getVisualization = function () {
        client.getVisualization(vizUrl, function (err, response, vizdata) {
          if (err) {
            console.error(err);
            return err;
          } else {
            window.CartoConfig.vizdata = vizdata;
            getDerivedVisualizations(vizdata);
          }
        });
      }

      var getDerivedVisualizations = function (vizdata) {
        client.getDerivedVisualizations(visualizationsNumber, function (err, response, data) {
          if (err) {
            console.error(err);
            return err;
          } else {
            window.CartoConfig.visualizations = _.filter(data.visualizations,
              function (visualization) {
                return visualization.id !== vizdata.id;
              });
            dataLoaded();
          }
        });
      }
    }

    getConfig();
  });
};

InitPublicMap();
