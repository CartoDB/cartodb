module.exports = {
  getUrlParams: function (conversion, location) {
    var urlTokens;

    conversion = conversion || {};
    location = location || window.location;
    urlTokens = _getUrlTokens.call(this, location);

    return urlTokens.length
      ? _buildParams.call(this, conversion, urlTokens)
      : {};
  },

  getPage: function () {
    var pathTokens = window.location.pathname.split('/');
    var lastTokenIndex = pathTokens.length - 1;
    return pathTokens[lastTokenIndex];
  },

  getVizID: function (page /* optional */) {
    var url = window.location.pathname;
    var vizStr = '/viz/';

    page = page || this.getPage();

    return url.substring(
      url.indexOf(vizStr) + vizStr.length,
      url.indexOf('/' + page)
    );
  }
};

function _getUrlTokens (location) {
  return location.search.slice(1).split('&');
}

function _buildParams (conversion, urlTokens) {
  var URL_PARAM_TO_DECODE = 0;
  var NUMBER_OF_PARAM_TOKENS = 2;
  var params = {};
  var i = 0;

  for (i; i < urlTokens.length; ++i) {
    var urlParams = urlTokens[i].split('=');
    var urlParamToDecode = urlParams[URL_PARAM_TO_DECODE];
    var callback = conversion[urlParamToDecode] || function defaultValue (value) {
      return value;
    };

    if (urlParams.length === NUMBER_OF_PARAM_TOKENS) {
      params[urlParamToDecode] = _decodeParam(urlParams, callback);
    }
  }

  return params;
}

function _decodeParam (urlParams, callback) {
  var URL_PARAM_URI = 1;
  var decodedParam = decodeURIComponent(urlParams[URL_PARAM_URI]);

  return callback(decodedParam);
}
