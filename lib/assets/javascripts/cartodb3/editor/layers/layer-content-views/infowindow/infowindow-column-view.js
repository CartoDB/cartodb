var cdb = require('cartodb-deep-insights.js');
var template = require('./infowindow-column.tpl');

/**
 * View for an individual column model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-column',

  initialize: function (opts) {
    this.column = opts.column;
    this.position = opts.position;
  },

  render: function () {
    this.$el.html(template({
      name: this.column
    }));
    this.$el.attr('data-model-cid', this.model.cid);

    return this;
  }
});