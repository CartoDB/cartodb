var LegendDefinitionModel = require('../../../../data/legend-definition-model');

var manager = (function () {
  var collection;

  function init (legendDefCollection) {
    collection = legendDefCollection;
  }

  return {
    init: function (legendDefinitionsCollection) {
      if (!legendDefinitionsCollection) {
        throw new Error('legendDefinitionsCollection is required');
      }
      init(legendDefinitionsCollection);
    },

    getLegendsCollection: function () {
      return collection;
    },

    add: function (model) {
      return collection.add(model);
    },

    remove: function (model) {
      return collection.remove(model);
    },

    createLegend: function (layerDefModel, type) {
      var legend = collection.findByLayerDefModelAndType(layerDefModel, type);
      if (!legend) {
        this.add(new LegendDefinitionModel({
          type: type
        }, {
          layerDefinitionModel: layerDefModel
        }));
      }
    },

    removeLegend: function (layerDefModel, type) {
      var legend = collection.findByLayerDefModelAndType(layerDefModel, type);
      if (legend) {
        this.remove(legend);
      }
    }
  };
})();

module.exports = manager;
