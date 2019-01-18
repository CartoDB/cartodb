var cdb = require('cartodb.js-v3');

/**
 *  Model to check if oAuth token is valid or not
 *
 *  - It needs a datasource name or it won't work.
 *
 *  new ServiceToken({ datasource_name: 'dropbox' })
 */

module.exports = cdb.core.Model.extend({

  _DATASOURCE_NAME: 'dropbox',

  initialize: function(attrs, opts) {
    if (opts.datasource_name) {
      this._DATASOURCE_NAME = opts.datasource_name;
    }
  },

  url: function(method) {
    var version = cdb.config.urlVersion('imports_service', method);
    return '/api/' + version + '/imports/service/' + this._DATASOURCE_NAME + '/token_valid'
  },

  parse: function(r) {
    return r
  }

});
