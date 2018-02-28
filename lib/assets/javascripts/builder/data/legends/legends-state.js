var _ = require('underscore');
var legendsMetadata = require('./legends-metadata');

var CUSTOM_ATTRIBUTES = ['title'];
var instance;
var legends;

var State = (function () {
  var getType = function (type) {
    var legend = legendsMetadata[type];
    return legend && legend.legendType;
  };

  var onLayerAdded = function (layer) {
    instance[layer.id] = {};
  };

  var onLayerRemoved = function (layer) {
    delete instance[layer.id];
  };

  return {
    init: function (layersDefinitionCollection, legendsDefinitionCollection) {
      if (!instance) {
        instance = {};
        layersDefinitionCollection.on('add', onLayerAdded);
        layersDefinitionCollection.on('remove', onLayerRemoved);
        legends = legendsDefinitionCollection;
        this.reset();
      }
    },

    reset: function () {
      legends.each(function (legend) {
        var layer = legend.layerDefinitionModel;
        if (!instance[layer.id]) {
          instance[layer.id] = {};
        }

        var legendType = getType(legend.get('type'));
        if (!instance[layer.id][legendType]) {
          instance[layer.id][legendType] = {};
        }

        var state = _.pick(legend.attributes, legend.attributes.conf.columns);
        instance[layer.id][legendType] = state;
      });
    },

    set: function (layer, type, attrs) {
      var attributes = _.pick(attrs, CUSTOM_ATTRIBUTES);
      var legendType = getType(type);
      if (instance && legendType) {
        if (!instance[layer.id]) {
          instance[layer.id] = {};
        }
        instance[layer.id][legendType] = attributes;
      }
    },

    get: function (layer, type) {
      var legendType = getType(type);
      return instance && legendType && instance[layer.id] && instance[layer.id][legendType];
    },

    getInstance: function () {
      return instance;
    }
  };
})();

module.exports = State;
