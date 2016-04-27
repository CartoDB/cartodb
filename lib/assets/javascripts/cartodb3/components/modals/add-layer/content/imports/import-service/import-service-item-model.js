var cdb = require('cartodb.js');

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
