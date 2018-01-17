var CoreView = require('backbone/core-view');
var template = require('./legends.tpl');

var LegendsView = CoreView.extend({
  render: function () {
    this.$el.html(template());

    return this;
  }
});

module.exports = LegendsView;
