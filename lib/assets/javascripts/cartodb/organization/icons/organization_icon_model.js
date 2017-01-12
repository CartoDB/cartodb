var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');

module.exports = Backbone.Model.extend({

  url: function(method) {
    var version = cdb.config.urlVersion('organization-assets', method);
    return '/api/' + version + '/organization/' + this.orgId + '/assets'
  },

  fileAttribute: 'resource',

  initialize: function(attrs, opts) {
    if (!opts.orgId) {
      throw new Error('Organization ID is required');
    }
    this.orgId = opts.orgId;
  }

});