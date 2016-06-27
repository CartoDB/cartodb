var Backbone = require('backbone');

/**
 *  Service item model
 *
 */

module.exports = Backbone.Model.extend({
  defaults: {
    id: '',
    filename: '',
    checksum: '',
    service: '',
    size: '',
    title: ''
  }
});
