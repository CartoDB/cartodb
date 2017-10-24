var _ = require('underscore');

// FIXME move helpers to a common folder
module.exports = {
  urlForStaticMap: function (mapsApiTemplate, visualization, width, height) {
    var API_MAP_PATH = '/api/v1/map/static/named/';
    var IMAGE_DEFAULT_EXTENSION = '.png';
    var TEMPLATE_PREFIX = 'tpl_';
    var mapOwnerUsername = visualization.permission.owner.username;
    var formattedMapsApiTemplate = mapsApiTemplate.replace('{user}', mapOwnerUsername);
    var template = TEMPLATE_PREFIX + visualization.id.replace(/-/g, '_');

    return formattedMapsApiTemplate +
      API_MAP_PATH +
      template +
      '/' +
      width +
      '/' +
      height +
      IMAGE_DEFAULT_EXTENSION +
      this._generateAuthTokensParams(visualization);
  },

  _generateAuthTokensParams: function (visualization) {
    var authTokens = visualization.auth_tokens;
    return authTokens && authTokens.length > 0
      ? _addAuthTokenParams(authTokens)
      : '';
  }
};

var _addAuthTokenParams = function (authTokens) {
  return '?' + _.map(authTokens, function (authToken) {
    return 'auth_token=' + authToken;
  }).join('&');
}
