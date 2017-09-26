var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var PublicMapView = require('./public_map_view');
var AssetsVersionUtils = require('../../utils/assets-version');

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

$(function () {
  cdb.init(function () {
    function dataLoaded () {
      var data = window.CartoConfig.data;
      var config = data.config;
      var userData = data.user_data;
      var currentUser = new cdb.admin.User(userData);

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set('url_prefix', userData.base_url);
      cdb.config.set(config);
      cdb.config.set('user', currentUser);

      var collection = new cdb.admin.Visualizations();
      var version = cdb.config.get('assets_url').split('/assets/')[1];

      var publicMapView = new PublicMapView({
        el: document.body,
        collection: collection,
        user: currentUser,
        config: config,
        assetsVersion: AssetsVersionUtils.getAssetsVersion(version)
      });
    }

    if (window.CartoConfig.data) {
      dataLoaded();
    } else {
      var client = new Carto.AuthenticatedClient();

      client.getConfig(function (err, response, data) {
        if (err) {
          console.error(err);

          return err;
        } else {
          window.CartoConfig.data = data;

          dataLoaded();
        }
      });
    }
  });
});
