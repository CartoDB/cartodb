const Backbone = require('backbone');
const MapLayer = require('dashboard/data/map-layer-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const TILED_LAYER_TYPE = 'Tiled';
const CARTODB_LAYER_TYPE = 'CartoDB';
const TORQUE_LAYER_TYPE = 'torque';

const REQUIRED_OPTS = [
  'configModel'
];

const LayersCollection = Backbone.Collection.extend({
  model: MapLayer,

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.comparator = function (m) {
      return parseInt(m.get('order'), 10);
    };
    this.bind('add', this._assignIndexes);
    this.bind('remove', this._assignIndexes);
  },

  url: function (method) {
    var version = this._configModel.urlVersion('layer', method);
    return `/api/${version}/maps/${this.map.id}/layers`;
  },

  parse: function (data) {
    return data.layers;
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
        for (var i = 1; i < this.size(); ++i) {
          var layer = this.at(i);
          var layerType = layer.get('type');
          layersByType[layerType] = layersByType[layerType] || [];
          layersByType[layerType].push(layer);
        }

        var lastOrder = 0;
        var sortedTypes = [CARTODB_LAYER_TYPE, TORQUE_LAYER_TYPE, TILED_LAYER_TYPE];
        for (var index = 0; index < sortedTypes.length; ++index) {
          var type = sortedTypes[index];
          var layers = layersByType[type] || [];
          for (var j = 0; j < layers.length; ++j) {
            var layerModel = layers[j];
            layerModel.set({
              order: ++lastOrder
            });
          }
        }
      }
    }
  }
});

module.exports = LayersCollection;
