const CoreView = require('backbone/core-view');
const template = require('./auth-message.tpl');

module.exports = CoreView.extend({
  render: function () {
    this.$el.html(template());
    return this;
  }
});
