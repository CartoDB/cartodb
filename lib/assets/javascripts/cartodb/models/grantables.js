var cdb = require('cartodb.js');
var Backbone = require('backbone');
var PagedSearchModel = require('../common/paged_search_model');

if (typeof module !== 'undefined') {
  module.exports = {};
}

/**
 * A collection of Grantable objects.
 */
cdb.admin.Grantables = Backbone.Collection.extend({

  model: cdb.admin.Grantable,

  url: function(method) {
    var version = cdb.config.urlVersion('organizationGrantables', method);
    return '/api/' + version + '/organization/' + this.organization.id + '/grantables';
  },

  initialize: function(users, opts) {
    if (!opts.organization) throw new Error('organization is required');
    this.organization = opts.organization;
    this.sync = Backbone.syncAbort; // adds abort behaviour
    PagedSearchModel.setupCollection(this, 'total_org_entries');
  },

  parse: function(response) {
    return response.grantables;
  }

});
