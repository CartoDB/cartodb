var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View representing the default "show" defaults of a group.
 * Only lists the users added to the group already.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['group', 'addUsersUrl'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.make('a', { href: this.options.addUsersUrl }, 'Add new users')
    );
    return this;
  },

  _initBinds: function() {
  }
});
