var cdb = require('cartodb.js');

/**
 * View to select formula widget options
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.selectedLayer) throw new Error('selectedLayer is required');

    this._selectedLayer = opts.selectedLayer;
  },

  render: function () {
    this.$el.html(JSON.stringify(this._selectedLayer));
    return this;
  }
});
