var cdb = require('cartodb.js');

/**
 *  Invalidate service token
 *
 *  - It needs a datasource name or it won't work.
 *
 */

module.exports = cdb.core.Model.extend({

  idAttribute: 'datasource',

  url: function() {
    return '/api/v1/imports/service/' + this.get('datasource') + '/invalidate_token'
  }

});