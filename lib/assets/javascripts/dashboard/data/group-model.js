var Backbone = require('backbone');
var GroupUsersCollection = require('dashboard/data/group-users-collection');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * Model representing a group.
 * Expected to be used in the context of a groups collection (e.g. cdb.admin.OrganizationGroups),
 * which defines its API endpoint path.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    display_name: '' // UI name, as given by
    // name: '', // internal alphanumeric representation, converted from display_name internally
    // organization_id: '',
  },

  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.parse(attrs || {}); // handle given attrs in the same way as for .fetch()
  },

  parse: function (attrs, options) {
    this.users = new GroupUsersCollection(attrs.users, {
      group: this,
      configModel: this._configModel
    });
    return attrs;
  },

  getModelType: () => 'group'
});
