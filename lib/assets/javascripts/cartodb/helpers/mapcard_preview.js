var _ = require('underscore-cdb-v3');

var _addAuthTokenParams = function (authTokens) {
  return '?' + _.map(authTokens, function (authToken) {
    return 'auth_token=' + authToken;
  }).join('&');
};

module.exports = {
  urlForStaticMap: function (mapsApiTemplate, visualization, width, height) {
    var API_MAP_PATH_TEMPLATE = '{userUrl}/api/v1/map/static/named/tpl_{vizID}/{width}/{height}.png{tokens}';

    var user = visualization.permission.owner.username;
    var vizID = visualization.id.replace(/-/g, '_');
    var tokens = this._generateAuthTokensParams(visualization);
    var userUrl = mapsApiTemplate.replace('{user}', user);

    return API_MAP_PATH_TEMPLATE
      .replace('{userUrl}', userUrl)
      .replace('{vizID}', vizID)
      .replace('{width}', width)
      .replace('{height}', height)
      .replace('{tokens}', tokens);
  },

  _generateAuthTokensParams: function (visualization) {
    var authTokens = visualization.auth_tokens;
    return authTokens && authTokens.length > 0
      ? _addAuthTokenParams(authTokens)
      : '';
  }
};
