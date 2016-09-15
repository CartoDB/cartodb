var _ = require('underscore');
var CategoryFormModel = require('../../../../data/legends/legend-category-definition-model');
var BubbleFormModel = require('../../../../data/legends/legend-bubble-definition-model');
var ChoroplethFormModel = require('../../../../data/legends/legend-choropleth-definition-model');

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleFormModel,
  'category': CategoryFormModel,
  'choropleth': ChoroplethFormModel
};

var manager = (function () {
  return {
    init: function (legendDefinitionsCollection) {
      if (!legendDefinitionsCollection) {
        throw new Error('legendDefinitionsCollection is required');
      }
      this.legendDefinitionsCollection = legendDefinitionsCollection;
    },

    getLegendsCollection: function () {
      return this.legendDefinitionsCollection;
    },

    add: function (model) {
      return this.legendDefinitionsCollection.add(model);
    },

    remove: function (model) {
      return this.legendDefinitionsCollection.remove(model);
    },

    createLegend: function (layerDefModel, type) {
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
      var Klass;
      var model;

      if (!legend) {
        Klass = LEGEND_MODEL_TYPE[type];
        model = new Klass({}, {
          layerDefinitionModel: layerDefModel
        });

        return this.add(model);
      }
    },

    removeLegend: function (layerDefModel, type) {
      var model;
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
      if (legend) {
        model = this.remove(legend);
      }
      return model;
    },

    removeAllLegend: function (layerDefModel) {
      var legends = this.legendDefinitionsCollection.findByLayerDefModel(layerDefModel);
      _.each(legends, this.remove, this);
    },

    hasMigratedLegend: function (layerDefModel) {
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'html');
      return !!legend;
    }
  };
})();

module.exports = manager;
