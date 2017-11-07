var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('show/views/panes');
  },

  render: function () {
    this.$el.html(this.template());

    return this;
  }
});
