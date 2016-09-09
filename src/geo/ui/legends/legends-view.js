var _ = require('underscore');
// var View = require('../../../core/view');
var Backbone = require('backbone');

var LayerLegendsView = require('./layer-legends-view');

var LegendsView = Backbone.View.extend({

  className: 'CDB-Legends',

  initialize: function (deps) {
    if (!deps.layersCollection) throw new Error('layersCollection is required');
    this._layersCollection = deps.layersCollection;

    this._isRendered = false;
    this._initBinds();
  },

  _initBinds: function () {
    this._layersCollection.on('add remove', this._onLayerAddedOrRemoved, this);
  },

  render: function () {
    var layerModelsWithLegends = this._getLayerModelsWithLegends();
    _.each(layerModelsWithLegends.reverse(), this._renderLayerLegends, this);
    this._isRendered = true;
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
    // If view has already been rendered and a layer is added / removed
    if (this._isRendered && this._hasLegends(layerModel)) {
      this._clear();
      this.render();
    }
  },

  _clear: function () {
    this.$el.html('');
  },

  show: function () {
    this.$el.show();
  },

  hide: function () {
    this.$el.hide();
  }
});

module.exports = LegendsView;
