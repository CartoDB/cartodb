var cdb = require('cartodb-deep-insights.js');
var template = require('./basemap-layer.tpl');

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'BlockList-item',

  initialize: function (opts) {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    this.$el.html(template({
      title: this.model.getName()
    }));
    return this;
  }
});
