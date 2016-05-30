var cdb = require('cartodb.js');
var template = require('./basemap-layer.tpl');

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'BlockList-item',

  events: {
    'click .js-title': '_onEditBasemap'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    var desc = _t('editor.layers.basemap.title-label');
    var title = this.model.getName() || desc;

    this.$el.html(template({
      title: title,
      desc: title === desc ? '' : desc
    }));

    return this;
  },

  _onEditBasemap: function (e) {
    e.stopPropagation();

    if (this._preventEditClick) {
      this._preventEditClick = false;
      return;
    }
    this._stackLayoutModel.nextStep(this.model, 'basemaps');
  }

});
