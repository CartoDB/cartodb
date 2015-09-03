var cdb = require('cartodb.js');

/**
 * View to add users to group.
 * Basically, render all users of organization but mark the ones that are already added.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.make('div', {}, 'TBD')
    );
    return this;
  },

  _initBinds: function() {
  }
});
