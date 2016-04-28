var cdb = require('cartodb-deep-insights.js');
var template = require('./infowindow-field.tpl');

/**
 * View for an individual column model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-field',

  initialize: function (opts) {
    this.fieldName = opts.column;
    this.position = opts.position;
  },

  render: function () {
    this.$el.html(template({
      name: this.fieldName
    }));
    this.$el.attr('data-view-cid', this.cid);

    return this;
  }
});