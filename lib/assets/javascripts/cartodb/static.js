var CartoNode = require('../../../../vendor/assets/javascripts/carto-node/carto-node.js');
var PACKAGE = require('../../../../package.json');
var UrlHelper = require('./helpers/url');

var version = PACKAGE.version;
var AssetsVersionHelper = require('./helpers/assets_version');
var GOOGLE_MAPS_SCRIPT_SRC = '//maps.googleapis.com/maps/api/js?sensor=false&v=3';

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

(function (window, document) {
  var client = new CartoNode.AuthenticatedClient();
  var assetsUrl;

  var redirectToLogin = function () {
    window.location = '/login';
  };

  var addSpinner = function () {
    var spinnerEl = document.querySelector('.spinner');
    spinnerEl.parentNode.classList.add('is-hidden');
  };

  var addGMaps = function (googleMapsQueryString) {
    var s = document.createElement('script');
    var t = document.getElementsByTagName('script')[0];
    s.async = false;
    s.type = 'text/javascript';
    s.src = GOOGLE_MAPS_SCRIPT_SRC + '&' + googleMapsQueryString;
    t.parentNode.insertBefore(s, t);
  };

  var addAssets = function () {
    (function (w, d, a, favicon, stylesheets, scripts, l, h, s, t) {
      l = d.createElement('link');
      l.rel = 'shortcut icon';
      l.href = a + favicon;
      h = d.getElementsByTagName('head')[0];
      h.appendChild(l);

      stylesheets.forEach(function (src) {
        l = d.createElement('link');
        l.rel = 'stylesheet';
        l.href = a + src;
        h = d.getElementsByTagName('head')[0];
        h.appendChild(l);
      });

      scripts.forEach(function (src) {
        s = d.createElement('script');
        t = d.getElementsByTagName('script')[0];
        s.async = false;
        s.src = a + src;
        t.parentNode.insertBefore(s, t);
      });
    })(window, document, assetsUrl, '/favicons/favicon.ico', window.StaticConfig.stylesheets, window.StaticConfig.scripts);
  };

  var getUserConfig = function () {
    client.getConfig(function (err, response, data) {
      var google_maps_query_string = window.CartoConfig.vizdata.user.google_maps_query_string;
      window.CartoConfig.data = data;

      if (err) {
        console.error(err);
        return redirectToLogin();
      }

      assetsUrl = AssetsVersionHelper.getAssetsUrl(version);
      addSpinner();

      if (google_maps_query_string != null) {
        addGMaps(google_maps_query_string);
      }

      addAssets();
    });
  };

  var getVisualization = function (params) {
    var vizID = UrlHelper.getVizID();
    var error;

    client.getVisualization(vizID, params, function (err, response, data) {
      if (err) {
        error = data.responseJSON;
        if (error && error.visualization) {
          window.CartoConfig.vizdata = window.CartoConfig.vizdata || {};
          window.CartoConfig.vizdata.user = window.CartoConfig.vizdata.user || {};
          window.CartoConfig.vizdata.user.google_maps_query_string = error.visualization.user && error.visualization.user.google_maps_query_string;
          getUserConfig();
        } else {
          console.error(error.errors);
        }
      } else {
        window.CartoConfig.vizdata = data;
      }
      getUserConfig();
    });
  };

  if (window.StaticConfig.visualization) {
    getVisualization(window.StaticConfig.visualization.params);
  } else {
    getUserConfig();
  }
})(window, document);
