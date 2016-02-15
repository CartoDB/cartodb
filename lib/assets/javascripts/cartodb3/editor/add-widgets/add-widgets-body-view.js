var cdb = require('cartodb.js');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');
    this._tablesCollection = opts.tablesCollection;
  },

  render: function () {
    this.$el.html('Create tab pane + widget definitions candidates from given tables TBD');
    return this;
  }
});
