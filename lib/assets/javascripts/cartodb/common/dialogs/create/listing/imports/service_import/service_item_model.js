var cdb = require('cartodb.js-v3');

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