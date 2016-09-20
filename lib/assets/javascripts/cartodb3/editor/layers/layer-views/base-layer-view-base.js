var CoreView = require('backbone/core-view');

/**
 * Base view for all base layer views.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'BlockList-item js-layer ui-state-disabled',

  events: {
    'click .js-title': '_onEditBasemap',
    'click .js-thumbnail': '_onEditBasemap'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    this.$el.html(this._getCompiledTemplate());

    return this;
  },

  _getCompiledTemplate: function () {
    throw new Error('subclasses of BasemapLayerViewBase must implement _getCompiledTemplate');
  },

  _onEditBasemap: function (e) {
    e.stopPropagation();

    this._stackLayoutModel.nextStep(this.model, 'basemaps');
  }
});
