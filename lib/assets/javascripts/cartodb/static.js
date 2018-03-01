var CartoNode = require('../../../../vendor/assets/javascripts/carto-node/carto-node.js');
var PACKAGE = require('../../../../package.json');
var UrlHelper = require('./helpers/url');

var version = PACKAGE.version;
var AssetsVersionHelper = require('./helpers/assets_version');
var GOOGLE_MAPS_SCRIPT_SRC = '//maps.googleapis.com/maps/api/js?v=3.30&sensor=false';
var VISUALIZATION_ERROR = 'Visualization not viewable';

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

  var addAssets = function () {
    (function (w, d, a, favicon, stylesheets, scripts, l, h, s, t) {
      var googleMapsQueryString = w.CartoConfig.vizdata
        ? w.CartoConfig.vizdata.user.google_maps_query_string
        : null;

      if (googleMapsQueryString) {
        s = d.createElement('script');
        t = d.getElementsByTagName('script')[0];
        s.async = false;
        s.type = 'text/javascript';
        s.src = GOOGLE_MAPS_SCRIPT_SRC + '&' + googleMapsQueryString;
        t.parentNode.insertBefore(s, t);
      }

      if (window.StaticConfig.vendor && window.StaticConfig.vendor.hubspot_form) {
        s = d.createElement('script');
        t = d.getElementsByTagName('script')[0];
        s.async = false;
        s.type = 'text/javascript';
        s.src = '//js.hsforms.net/forms/v2.js';
        t.parentNode.insertBefore(s, t);
      }

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

  var getUserConfig = function (visualizationError) {
    client.getConfig(function (err, response, data) {
      if (err) {
        return redirectToLogin();
      }

      if (!data.user_data && visualizationError !== VISUALIZATION_ERROR) {
        return redirectToLogin();
      }

      window.CartoConfig.data = data;
      assetsUrl = AssetsVersionHelper.getAssetsUrl(version);
      addSpinner();
      addAssets();
    });
  };

  var getVisualization = function (params) {
    var vizID = UrlHelper.getVizID();

    client.getVisualization(vizID, params, function (err, response, data) {
      if (err) {
        error = data.responseJSON;

        if (error && error.visualization) {
          window.CartoConfig.vizdata = error.visualization;
          getUserConfig(error.errors);
        } else if (error.errors !== VISUALIZATION_ERROR) {
          return redirectToLogin();
        } else {
          console.error(error);
        }
      } else {
        window.CartoConfig.vizdata = data;
        getUserConfig();
      }
    });
  };

  if (window.StaticConfig.visualization) {
    getVisualization(window.StaticConfig.visualization.params);
  } else {
    getUserConfig();
  }
})(window, document);
