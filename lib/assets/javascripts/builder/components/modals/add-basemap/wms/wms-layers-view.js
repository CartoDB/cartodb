var WMSLayerView = require('./wms-layer-view');
var CoreView = require('backbone/core-view');

/**
 * Sub view, to select what layer to use as basemap.
 */
module.exports = CoreView.extend({

  className: 'List',
  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!this.model) throw new Error('model is required');

    this._customBaselayersCollection = opts.customBaselayersCollection;
  },

  render: function () {
    this.clearSubViews();
    this.$el.append.apply(this.$el, this._renderedLayers());
    return this;
  },

  _renderedLayers: function () {
    return this.model.getLayers().map(function (layer) {
      var view = new WMSLayerView({
        model: layer,
        customBaselayersCollection: this._customBaselayersCollection
      });

      this.addView(view);

      return view.render().el;
    }, this);
  }

});
