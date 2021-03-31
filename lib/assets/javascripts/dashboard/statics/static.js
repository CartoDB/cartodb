var CartoNode = require('../../../../../vendor/assets/javascripts/carto-node/carto-node.js');
var UrlHelper = require('./helpers/url');
var Redirector = require('../helpers/redirector');

/* global __ASSETS_VERSION__:false, __CARTO_BUILDER_ASSET_HOST__:false */
// __ASSETS_VERSION__ is injected via Webpack to avoid requiring whole package.json file
// __CARTO_BUILDER_ASSET_HOST__ is also injected via Webpack
var version = __ASSETS_VERSION__;
var CARTO_BUILDER_ASSET_HOST = __CARTO_BUILDER_ASSET_HOST__;

var AssetsVersionHelper = require('../helpers/assets-version');
var GOOGLE_MAPS_SCRIPT_SRC = '//maps.googleapis.com/maps/api/js?v=3.32&sensor=false';
var VISUALIZATION_ERROR = 'Visualization not viewable';
var STATE_LOCKED = 'locked';

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

(function (window, document) {
  var client = new CartoNode.AuthenticatedClient();
  var assetsUrl;

  var redirectTo = function (url) {
    window.location = url;
  };

  var redirectToLogin = function () {
    window.location = '/login';
  };

  var redirectToMaintenanceMode = function (baseURL) {
    window.location = baseURL + '/maintenance_mode';
  };

  var redirectToLockout = function (baseURL) {
    window.location = baseURL + '/lockout';
  };

  var redirectToUnverified = function (baseURL) {
    window.location = baseURL + '/unverified';
  };

  var redirectToMultifactorAuthentication = function () {
    window.location = '/multifactor_authentication';
  };

  var addSpinner = function () {
    var spinnerEl = document.querySelector('.spinner');
    spinnerEl.parentNode.classList.add('is-hidden');
  };

  var getEntryPointFeatureFlags = function (staticConfig) {
    var featureFlagsData = staticConfig.feature_flags;

    if (!featureFlagsData) {
      return [];
    }

    return Object.keys(featureFlagsData);
  };

  var getAssetsToLoad = function (userData) {
    var entryPointFeatureFlags = getEntryPointFeatureFlags(window.StaticConfig);
    var userFeatureFlags = userData ? userData.feature_flags : [];

    var featureFlagToUse = entryPointFeatureFlags.filter(function (featureFlag) {
      return userFeatureFlags.indexOf(featureFlag) !== -1;
    })[0];

    if (featureFlagToUse) {
      return window.StaticConfig.feature_flags[featureFlagToUse];
    }

    return {
      stylesheets: window.StaticConfig.stylesheets,
      scripts: window.StaticConfig.scripts
    };
  };

  var addAssets = function (options) {
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
    })(window, document, assetsUrl, '/favicons/favicon.ico', options.stylesheets, options.scripts);
  };

  var markAsReady = function (userData) {
    assetsUrl = AssetsVersionHelper.getAssetsUrl(version);
    addSpinner();

    var assets = getAssetsToLoad(userData);
    addAssets({
      stylesheets: assets.stylesheets,
      scripts: assets.scripts
    });
  };

  var getUserConfig = function (visualizationError) {
    client.getConfig(function (err, response, data) {
      if (err) {
        if (data.responseJSON && data.responseJSON.error === 'maintenance_mode') {
          var baseURL = Redirector.getBaseUrl(window.location);
          return redirectToMaintenanceMode(baseURL);
        } else {
          return redirectToLogin();
        }
      }

      var userData = data.user_data;

      if (!userData && visualizationError !== VISUALIZATION_ERROR) {
        return redirectToLogin();
      }

      if (userData && userData.state === STATE_LOCKED) {
        return redirectToLockout(userData.base_url);
      }

      if (userData && userData.unverified === true) {
        return redirectToUnverified(userData.base_url);
      }

      if (data.mfa_required === true) {
        return redirectToMultifactorAuthentication();
      }

      if (Redirector.needsToChangeBaseURL(userData.base_url)) {
        return redirectTo(userData.base_url + '/' + window.StaticConfig.page);
      }

      window.CartoConfig.data = data;

      markAsReady(userData);
    });
  };

  var getVisualization = function (params) {
    var vizID = UrlHelper.getVizID();

    client.getVisualization(vizID, params, function (err, response, data) {
      if (err) {
        var error = data.responseJSON;

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
  } else if (window.StaticConfig.anonymous) {
    const isRootLevel = CARTO_BUILDER_ASSET_HOST === '//';
    const baseUrl = isRootLevel ? '/assets' : CARTO_BUILDER_ASSET_HOST + '/assets';
    window.StaticConfig.assetsBaseUrl = baseUrl;
    markAsReady();
  } else {
    getUserConfig();
  }
})(window, document);
