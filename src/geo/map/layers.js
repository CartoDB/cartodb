var _ = require('underscore');
var Backbone = require('backbone');

var TILED_LAYER_TYPE = 'Tiled';
var CARTODB_LAYER_TYPE = 'CartoDB';
var TORQUE_LAYER_TYPE = 'torque';

var Layers = Backbone.Collection.extend({

  initialize: function () {
    this.comparator = function (m) {
      return parseInt(m.get('order'), 10);
    };
    this.bind('add', this._assignIndexes);
    this.bind('remove', this._assignIndexes);
  },

  /**
   * each time a layer is added or removed
   * the index should be recalculated
   */
  _assignIndexes: function (model, col, options) {
    if (this.size() > 0) {
      // Assign an order of 0 to the first layer
      this.at(0).set({ order: 0 });

      if (this.size() > 1) {
        var layersByType = this.reduce(function (layersByType, layerModel, index) {
          var type = layerModel.get('type');
          if (index === 0 && type === TILED_LAYER_TYPE) { return layersByType; }
          layersByType[type] = layersByType[type] || [];
          layersByType[type].push(layerModel);
          return layersByType;
        }, {});

        var lastOrder = 1;
        var sortedTypes = [CARTODB_LAYER_TYPE, TORQUE_LAYER_TYPE, TILED_LAYER_TYPE];
        _.each(sortedTypes, function (layerType) {
          var layers = layersByType[layerType] || [];
          _.each(layers, function (layerModel) {
            layerModel.set({
              order: lastOrder
            });
            lastOrder += 1;
          });
        });
      }
    }

    this.sort();
  },

  getCartoDBLayers: function () {
    return this._getLayersByType(CARTODB_LAYER_TYPE);
  },

  getTiledLayers: function () {
    return this._getLayersByType(TILED_LAYER_TYPE);
  },

  getTorqueLayers: function () {
    return this._getLayersByType(TORQUE_LAYER_TYPE);
  },

  _getLayersByType: function (layerType) {
    return this.select(function (layerModel) {
      return layerModel.get('type') === layerType;
    });
  },

  getLayersWithLegends: function () {
    return this.select(function (layerModel) {
      return !!layerModel.legends;
    });
  },

  moveCartoDBLayer: function (from, to) {
    if (from === to) {
      return false;
    }

    var movingLayer = this.at(from);

    if (!movingLayer || movingLayer.get('type') !== CARTODB_LAYER_TYPE) {
      return false;
    }

    this.remove(movingLayer, { silent: true });
    this.add(movingLayer, {
      at: to,
      silent: true
    });

    return movingLayer;
  }
});

module.exports = Layers;
