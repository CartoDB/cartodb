var CoreView = require('backbone/core-view');
var template = require('./fill-tab.tpl');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    this.$el.html(template());
    return this;
  }

});
