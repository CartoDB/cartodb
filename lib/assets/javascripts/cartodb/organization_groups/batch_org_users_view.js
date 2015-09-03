var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View to do some batch operation on a set of organization users.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.getTemplate('organization_groups/batch_org_users')
    );
    return this;
  }
});
