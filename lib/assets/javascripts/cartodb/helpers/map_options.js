var _ = require('underscore');

var mapOptionsFromUrlParams = {
  search: _isEqualToTrue,
  title: _isEqualToTrue,
  description: _isEqualToTrue,
  shareable: _isEqualToTrue,
  fullscreen: _isEqualToTrue,
  cartodb_logo: _isEqualToTrue,
  scrollwheel: _isEqualToTrue,
  sublayer_options: _layerVisibility,
  layer_selector: _isEqualToTrue,
  legends: _isEqualToTrue
};

var MOBILE_DEVICES_REGEX = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

var VizPublicMapPermissions = {
  PASSWORD: 'protected_public_map',
  PUBLIC: 'public_map'
};

module.exports = {
  getUrlParams: function (conversion, location) {
    var urlTokens, params, i;
    var URL_PARAM_TO_DECODE = 0;
    var NUMBER_OF_PARAM_TOKENS = 2;

    conversion = conversion || {};
    location = location || window.location;
    urlTokens = _getUrlTokens.call(this, location);
    params = {};
    i = 0;

    for (i; i < urlTokens.length; ++i) {
      var urlParams = urlTokens[i].split('=');
      var urlParamToDecode = urlParams[URL_PARAM_TO_DECODE];
      var paramFunction = conversion[urlParamToDecode] || _defaultValue.bind(this);

      if (urlParams.length === NUMBER_OF_PARAM_TOKENS) {
        params[urlParamToDecode] = _decodeParam
          .call(this, paramFunction, urlParams);
      }
    }

    return params;
  },

  getPublicMapPage: function () {
    var pathTokens = window.location.pathname.split('/');
    return pathTokens[pathTokens.length - 1];
  },

  getMapOptions: function () {
    return this.getUrlParams(mapOptionsFromUrlParams);
  },

  getVizUrl: function (page) {
    var url = window.location.pathname;
    var vizStr = '/viz/';

    return url.substring(
      url.indexOf(vizStr) + vizStr.length,
      url.indexOf('/' + page)
    );
  },

  isMobileDevice: function () {
    return MOBILE_DEVICES_REGEX.test(navigator.userAgent);
  }
};

function _getUrlTokens (location) {
  return location.search.slice(1).split('&');
}

function _defaultValue (value) {
  return value;
}

function _decodeParam (paramFunction, urlParams) {
  var URL_PARAM_URI = 1;
  var decodedParam = decodeURIComponent(urlParams[URL_PARAM_URI]);

  return paramFunction(decodedParam);
}

function _isEqualToTrue (value) {
  return value === 'true';
}

function _layerVisibility (value) {
  var BASE = 10;

  if (!value || !value.length) {
    return null;
  }

  return _.map(value.split('|'), function (value) {
    return {
      visible: !!parseInt(value, BASE)
    };
  });
}
