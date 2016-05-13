var Backbone = require('backbone');
var LayerModelBase = require('./layer-model-base');

var TILED_LAYER_TYPE = 'Tiled';
var CARTODB_LAYER_TYPE = 'CartoDB';
var TORQUE_LAYER_TYPE = 'torque';

var Layers = Backbone.Collection.extend({

  model: LayerModelBase,

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
        var layersByType = {};
        var i;
        for (i = 1; i < this.size(); ++i) {
          var layer = this.at(i);
          var layerType = layer.get('type');
          layersByType[layerType] = layersByType[layerType] || [];
          layersByType[layerType].push(layer);
        }

        var lastOrder = 0;
        var sortedTypes = [CARTODB_LAYER_TYPE, TORQUE_LAYER_TYPE, TILED_LAYER_TYPE];
        for (i = 0; i < sortedTypes.length; ++i) {
          var type = sortedTypes[i];
          var layers = layersByType[type] || [];
          for (var j = 0; j < layers.length; ++j) {
            layer = layers[j];
            layer.set({
              order: ++lastOrder
            });
          }
        }
      }
    }

    this.sort();
  }
});

module.exports = Layers;
