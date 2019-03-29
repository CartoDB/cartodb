var CoreView = require('backbone/core-view');
var template = require('./edit-feature-control.tpl');

module.exports = CoreView.extend({

  render: function () {
    this.$el.html(template());

    return this;
  }

});
