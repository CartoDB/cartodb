var CoreView = require('backbone/core-view');
var template = require('./basemap-layer.tpl');
var layerTypesAndKinds = require('../../data/layer-types-and-kinds');

/**
 * View for an individual layer definition model.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'BlockList-item js-layer ui-state-disabled',

  events: {
    'click .js-title': '_onEditBasemap'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    // tiled is alwasy baselayer, if it's not at the bottom are the labels

    if (this._noAction()) {
      this.$el.addClass('BlockList-item--noAction');
    }

    var desc = _t('editor.layers.basemap.title-label');
    var title = this.model.getName() || desc;

    this.$el.html(template({
      title: title,
      desc: title === desc ? '' : desc
    }));

    return this;
  },

  _noAction: function () {
    return layerTypesAndKinds.isTiledType(this.model.get('type')) && this.model.get('order') !== 0;
  },

  _onEditBasemap: function (e) {
    e.stopPropagation();

    if (this._noAction()) return;

    this._stackLayoutModel.nextStep(this.model, 'basemaps');
  }

});
