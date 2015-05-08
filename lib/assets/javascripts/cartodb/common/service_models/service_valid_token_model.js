var cdb = require('cartodb.js');

/**
 *  Check if service token is valid
 *
 *  - It needs a datasource name or it won't work.
 *
 */

module.exports = cdb.core.Model.extend({

  idAttribute: 'datasource',

  url: function() {
    return '/api/v1/imports/service/' + this.get('datasource') + '/token_valid'
  }

});