var _ = require('underscore');
var LEGENDS_METADATA = {
  bubble: {
    legendType: 'size'
  },
  category: {
    legendType: 'color'
  },
  choropleth: {
    legendType: 'color'
  },
  custom: {
    legendType: 'color'
  },
  custom_choropleth: {
    legendType: 'color'
  }
};

var CUSTOM_ATTRIBUTES = ['title'];
var instance;
var layers;
var legends;

var State = (function () {
  var getType = function (type) {
    var legend = LEGENDS_METADATA[type];
    return legend && legend.legendType;
  };

  var initBinds = function () {
    layers.on('add', onLayerAdded);
    layers.on('remove', onLayerRemoved);
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
        layers = layersDefinitionCollection;
        legends = legendsDefinitionCollection;
        this.reset();
        initBinds();

        window.legendsState = instance;
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
        instance[layer.id][legendType] = attributes;
      }
    },

    get: function (layer, type) {
      var legendType = getType(type);
      return instance && legendType && instance[layer.id][legendType];
    }
  };
})();

module.exports = State;
