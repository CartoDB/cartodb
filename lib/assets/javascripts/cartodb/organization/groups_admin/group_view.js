var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View for an individual group.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'OrganizationList-user',

  initialize: function() {
    _.each(['model', 'newGroupUrl'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    this.$el.html(
      this.getTemplate('organization/groups_admin/group')({
        displayName: this.model.get('display_name'),
        url: this.options.newGroupUrl(this.model)
      })
    );
    return this;
  }

});
