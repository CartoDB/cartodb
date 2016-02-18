var cdb = require('cartodb.js');

/**
 * View to select formula widget options
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns is required');

    this._columns = opts.columns;
  },

  render: function () {
    this.$el.html(JSON.stringify(this._columns));
    return this;
  }
});
