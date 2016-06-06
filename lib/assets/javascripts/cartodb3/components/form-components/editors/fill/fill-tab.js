var cdb = require('cartodb.js');
var template = require('./fill-tab.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    this.$el.html(template());
    return this;
  }

});
