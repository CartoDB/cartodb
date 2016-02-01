var cdb = require('cartodb-v3');

/**
 *  Service item model
 *
 */

module.exports = cdb.core.Model.extend({
  
  defaults: {
    id: '',
    filename: '',
    checksum: '',
    service: '',
    size: '',
    title: ''
  }

});