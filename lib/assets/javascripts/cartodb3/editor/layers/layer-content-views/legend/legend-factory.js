var _ = require('underscore');
var CategoryModel = require('../../../../data/legends/legend-category-definition-model');
var BubbleModel = require('../../../../data/legends/legend-bubble-definition-model');
var ChoroplethModel = require('../../../../data/legends/legend-choropleth-definition-model');
var CustomhModel = require('../../../../data/legends/legend-custom-definition-model');

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleModel,
  'category': CategoryModel,
  'choropleth': ChoroplethModel,
  'custom': CustomhModel
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
          layerDefinitionModel: layerDefModel,
          configModel: this.legendDefinitionsCollection.configModel,
          vizId: this.legendDefinitionsCollection.vizId
        });

        legend = this.add(model);
      }

      return legend;
    },

    removeLegend: function (layerDefModel, type) {
      var model;
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
      if (legend) {
        model = this.remove(legend);
      }
      return model;
    },

    find: function (layerDefModel, type) {
      return this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
    },

    removeAllLegend: function (layerDefModel) {
      var legends = this.legendDefinitionsCollection.findByLayerDefModel(layerDefModel);
      _.each(legends, this.remove, this);
    },

    hasMigratedLegend: function (layerDefModel) {
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'html');
      return !!legend;
    },

    removeImportedLegends: function (layerDefModel) {
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'html');
      if (legend) {
        this.remove(legend);
      }
    }
  };
})();

module.exports = manager;
