var cdb = require('cartodb-deep-insights.js');
var template = require('./infowindow-column.tpl');

/**
 * View for an individual column model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  initialize: function (opts) {
  },

  render: function () {
    this.$el.html(template({
      name: this.model.get('name')
    }));

    return this;
  }
});