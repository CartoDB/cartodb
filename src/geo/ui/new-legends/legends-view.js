var _ = require('underscore');
var Backbone = require('backbone');
var LayerLegendsView = require('./layer-legends-view');

var LegendsView = Backbone.View.extend({

  className: 'CDB-Legends',

  initialize: function (deps) {
    if (!deps.layersCollection) throw new Error('layersCollection is required');

    this._layersCollection = deps.layersCollection;
    this._layersCollection.on('add remove', this._onLayerAddedOrRemoved, this);
  },

  render: function () {
    var layerModelsWithLegends = this._getLayerModelsWithLegends();
    _.each(layerModelsWithLegends.reverse(), this._renderLayerLegends, this);
    return this;
  },

  _getLayerModelsWithLegends: function () {
    return this._layersCollection.select(this._hasLegends);
  },

  _hasLegends: function (layerModel) {
    return layerModel.legends;
  },

  _renderLayerLegends: function (layerModel) {
    var layerLegendsView = new LayerLegendsView({ model: layerModel });
    this.$el.append(layerLegendsView.render().$el);
  },

  _onLayerAddedOrRemoved: function (layerModel) {
    if (this._hasLegends(layerModel)) {
      this.render();
    }
  }
});

module.exports = LegendsView;
