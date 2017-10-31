var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Carto = require('../../carto-node/index.js.babel');
var AssetsHelper = require('../helpers/assets_version');
var PasswordProtectedView = require('./password_protected_main_view');
var PACKAGE = require('../../../../../package.json');
var VERSION = PACKAGE.version;

var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

var TITLE = _.template('<%- title %> | CARTO');

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

var getPublicMapPageId = function () {
  var pathTokens = window.location.pathname.split('/');
  return pathTokens[pathTokens.length - 2];
};

function dataLoaded (data) {
  var assetsVersion = AssetsHelper.getAssetsVersion(VERSION);
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
    handleRedirection: function () {
      window.location.assign('http://carto.com');
    }
  });

  document.body.appendChild(view.render().el);
}

$(function () {
  cdb.init(function () {
    if (window.CartoConfig.data) {
      dataLoaded(window.CartoConfig.data);
    } else {
      var client = new Carto.AuthenticatedClient();

      client.getConfig(function (err, response, data) {
        if (err) {
          console.error(err);

          return err;
        } else {
          window.CartoConfig.data = data;
          dataLoaded(data);
        }
      });
    }
  });
});
