var Backbone = require('backbone');
var GroupUsersCollection = require('dashboard/data/group-users-collection');

/**
 * Model representing a group.
 * Expected to be used in the context of a groups collection (e.g. cdb.admin.OrganizationGroups),
 * which defines its API endpoint path.
 */
module.export = Backbone.Model.extend({

  defaults: {
    display_name: '' // UI name, as given by
    // name: '', // internal alphanumeric representation, converted from display_name internally
    // organization_id: '',
  },

  initialize: function (attrs) {
    this.parse(attrs || {}); // handle given attrs in the same way as for .fetch()
  },

  parse: function (attrs) {
    this.users = new GroupUsersCollection(attrs.users, {
      group: this
    });
    return attrs;
  }

});
