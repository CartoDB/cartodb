var _ = require('underscore-cdb-v3');
/**
* Mapcard preview url generator
*/

module.exports = {
  url_for_static_map: function (maps_api_template, visualization, width, height) {
    var mapsApiTemplate = maps_api_template.replace('{user}', visualization._permissionModel.get('owner').username);
    var template = 'tpl_' + visualization.get('id').replace(/-/g, '_');

    var imageUrl = mapsApiTemplate + '/api/v1/map/static/named/' + template + '/' + width + '/' + height + '.png' + this._generateAuthTokensParams(visualization);

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
