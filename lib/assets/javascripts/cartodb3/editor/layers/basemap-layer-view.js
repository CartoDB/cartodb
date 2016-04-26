var cdb = require('cartodb.js');
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
    var desc = _t('editor.tab-pane.layers.basemap');
    var title = this.model.getName() || desc;

    this.$el.html(template({
      title: title,
      desc: title === desc ? '' : desc
    }));

    return this;
  }
});
