/**
 * Model representing an entity (user, group, etc.) that may share a Visualization.
 * Actual model is wrapped with additional metadata for the grantable context.
 */
cdb.admin.Grantable = cdb.core.Model.extend({

  // @return {Object} instance of the real model this grantable entitity represents
  //   Keep in mind that this returns a new instance of that model (i.e. not a cache version)
  realModel: function() {
    return new cdb.admin[this._modelName()](this.get('model'));
  },

  _modelName: function() {
    return cdb.Utils.capitalize(this.get('type'));
  }

});

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
  },

  parse: function(response) {
    // response also contains { total_entries: {Number}, total_org_entries: {Number} }, not yet used
    return response.grantables;
  }

});
