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

    add: function (model, cb) {
      var self = this;
      model.save(null, {
        success: function (model) {
          self.legendDefinitionsCollection.add(model);
        },
        complete: function () {
          cb && cb();
        }
      });
    },

    save: function (model, cb) {
      model.save(null, {complete: function (model) {
        cb && cb();
      }});
    },

    remove: function (model, cb) {
      var self = this;
      model.destroy({
        success: function (model) {
          self.legendDefinitionsCollection.remove(model);
        },
        complete: function () {
          cb && cb();
        }
      });
    },

    createLegend: function (layerDefModel, type, cb) {
      var model = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
      var Klass;

      if (!model) {
        Klass = LEGEND_MODEL_TYPE[type];
        model = new Klass({}, {
          layerDefinitionModel: layerDefModel,
          configModel: this.legendDefinitionsCollection.configModel,
          vizId: this.legendDefinitionsCollection.vizId
        });

        this.add(model, cb);
      } else {
        this.save(model, cb);
      }

      return model;
    },

    removeLegend: function (layerDefModel, type, cb) {
      var legend = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
      if (legend) {
        this.remove(legend, cb);
      } else {
        cb && cb();
      }
      return legend;
    },

    find: function (layerDefModel, type) {
      return this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
    },

    removeAllLegend: function (layerDefModel) {
      var legends = this.legendDefinitionsCollection.findByLayerDefModel(layerDefModel);
      _.each(legends, function (legend) {
        legend.get('type') !== 'custom' && this.remove(legend);
      }, this);
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
