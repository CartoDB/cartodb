var CoreView = require('backbone/core-view');
var template = require('./layer-tab-pane-placeholder.tpl');

module.exports = CoreView.extend({

  render: function () {
    this.$el.html(template());
    return this;
  }
});
