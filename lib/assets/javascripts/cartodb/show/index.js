var cdb = require('cartodb.js-v3');
var Carto = require('../../../core/javascripts/carto-node/index');
var AssetsVersionHelper = require('../helpers/assets_version');
var UrlHelper = require('../helpers/url');

var PanesView = require('./panes_view_static');
var HeaderView = require('./header_view_static');

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

function dataLoaded (data, vizdata, mapdata) {
  var assetsVersion = AssetsVersionHelper.getAssetsVersion(VERSION);
  var config = window.config = data.config;
  var vizID = UrlHelper.getVizID();
  var basemaps = cdb.config.get('basemaps');
  var user = new cdb.admin.User(data.user_data);
  var errors = new cdb.admin.ErrorStats({ user_data: data });
  var metrics = new cdb.admin.Metrics();

  cdb.config.set(config);
  cdb.config.set('api_key', data.user_data.api_key);
  cdb.templates.namespace = 'cartodb/';
  cdb.config.set('url_prefix', data.base_url);

  var header = new HeaderView({
    vizdata: vizdata
  });
  document.body.appendChild(header.render().el);

  var panes = new PanesView();
  document.body.appendChild(panes.render().el);

  this.table = new cdb.admin.TableEditorView({
    basemaps: basemaps || cdb.admin.DEFAULT_BASEMAPS,
    baseLayers: data.layers,
    config: config,
    map_data: mapdata,
    user_data: data.user_data,
    vis_data: vizdata
  });

  window.table = this.table;
  window.table_router = new cdb.admin.TableRouter(this.table);

  Backbone.history.start({
    pushState: true,
    root: cdb.config.prefixUrlPathname() + '/'
  });
}

$(function () {
  cdb.init(function () {
    var client = new Carto.AuthenticatedClient();

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

    if (window.CartoConfig.data) {
      getVisualization(window.CartoConfig.data);
    } else {
      getConfig();
    }
  });
});
