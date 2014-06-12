/**
 * this model contains information about the organization for
 * the current user and the users who are inside the organizacion.
 *
 * Attributes:
 *
 * - users: collection with user instances whithin the organization (see cdb.admin.Organization.Users
 *
 *
 */

cdb.admin.Organization = cdb.core.Model.extend({

  url: '/api/v1/org/',

  initialize: function() {
    this.users = new cdb.admin.Organization.Users();
  }

});

// helper to manage organization users
cdb.admin.Organization.Users = Backbone.Collection.extend({
  url: '/api/v1/org/users',
  model: cdb.admin.User
});

