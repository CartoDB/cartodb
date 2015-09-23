/**
 * Collection of a User's groups.
 */
cdb.admin.UserGroups = Backbone.Collection.extend({

  model: cdb.admin.Group,

  initialize: function(models, opts) {
    this.organization = opts.organization;
  }

});
