var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({
  render: function () {
    this.$el.append("toggle");
    return this;
  }
});
