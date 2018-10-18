var _ = require('underscore');
/**
* Mapcard preview url generator
*/

module.exports = {
  urlForStaticMap: function (mapsApiTemplate, visualization, width, height) {
    var formattedMapsApiTemplate = mapsApiTemplate.replace('{user}', visualization._permissionModel.get('owner').username);
    var template = 'tpl_' + visualization.get('id').replace(/-/g, '_');

    var imageUrl = formattedMapsApiTemplate + '/api/v1/map/static/named/' + template + '/' + width + '/' + height + '.png' + this._generateAuthTokensParams(visualization);

    return imageUrl;
  },

  _generateAuthTokensParams: function (visualization) {
    var authTokens = visualization.get('auth_tokens');
    if (authTokens && authTokens.length > 0) {
      return '?' + _.map(authTokens, function (t) {
        return 'auth_token=' + t;
      }).join('&');
    } else {
      return '';
    }
  }
};
