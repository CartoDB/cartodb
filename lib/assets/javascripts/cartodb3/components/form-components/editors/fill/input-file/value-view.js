var CoreView = require('backbone/core-view');
var template = require('./value-view.tpl');

module.exports = CoreView.extend({
  initialize: function (opts) {
  },

  render: function () {
    this.$el.append(template);
    return this;
  }
});
