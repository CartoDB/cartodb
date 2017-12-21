var cdb = require('cartodb.js-v3');
var AssetsVersionHelper = require('../helpers/assets_version');
var UrlHelper = require('../helpers/url');
var MainView = require('./main_view_static');

var PACKAGE = require('../../../../../package.json');
var VERSION = PACKAGE.version;

var TITLE = _.template('<%= title %> | CARTO');

var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);

var client = new CartoNode.AuthenticatedClient();

function dataLoaded (data, vizdata, mapdata) {
  var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);
  var config = window.config = data.config;
  var vizID = UrlHelper.getVizID();
  var basemaps = vizdata.user.basemaps;
  var user = new cdb.admin.User(data.user_data);
  var errors = new cdb.admin.ErrorStats({ user_data: data });
  var metrics = new cdb.admin.Metrics();

  window.user_data = data.user_data;

  cdb.config.set(config);
  cdb.config.set('api_key', data.user_data.api_key);
  cdb.templates.namespace = 'cartodb/';
  cdb.config.set('url_prefix', data.user_data.base_url);

  var mainView = new MainView({
    el: '#app',
    assetsVersion: assetsVersion,
    baseLayers: data.layers,
    basemaps:  basemaps,
    config: config,
    mapdata: mapdata,
    user: user,
    userData: data.user_data,
    vizdata: vizdata
  });
}

function getConfig () {
  client.getConfig(function (err, response, data) {
    if (err) {
      console.error(err);

      return err;
    } else {
      window.CartoConfig.data = data;
      getVisualization(data);
    }
  });
}

var getVisualization = function (data) {
  var params = {
    show_permission: true,
    show_liked: true,
    show_stats: true,
    show_auth_tokens: true,
    show_user_basemaps: true,
    fetch_user: true,
    privacy: 'PUBLIC'
  };

  var vizID = UrlHelper.getVizID();

  client.getVisualization(vizID, params, function (err, response, vizdata) {
    if (err) {
      console.error(err);
      return err;
    } else {
      window.CartoConfig.vizdata = vizdata;
      getMapdata(data, vizdata);
    }
  });
}

var getMapdata = function (data, vizdata) {
  client.getMap(vizdata.map_id, function (err, response, mapdata) {
    if (err) {
      console.error(err);
      return err;
    } else {
      window.CartoConfig.mapdata = mapdata;
      dataLoaded(data, vizdata, mapdata);
    }
  });
}

$(function () {
  cdb.init(function () {
    if (window.CartoConfig.data) {
      getVisualization(window.CartoConfig.data);
    } else {
      getConfig();
    }
  });
});
