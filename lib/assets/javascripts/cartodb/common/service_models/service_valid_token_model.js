var cdb = require('cartodb.js-v3');

/**
 *  Check if service token is valid
 *
 *  - It needs a datasource name or it won't work.
 *
 */

module.exports = cdb.core.Model.extend({

  idAttribute: 'datasource',

  url: function(method) {
    var version = cdb.config.urlVersion('imports_service', method);
    return '/api/' + version + '/imports/service/' + this.get('datasource') + '/token_valid'
  }

});
