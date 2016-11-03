var _ = require('underscore');
var CategoryModel = require('../../../../data/legends/legend-category-definition-model');
var BubbleModel = require('../../../../data/legends/legend-bubble-definition-model');
var ChoroplethModel = require('../../../../data/legends/legend-choropleth-definition-model');
var CustomChoroplethModel = require('../../../../data/legends/legend-custom-choropleth-definition-model');
var CustomhModel = require('../../../../data/legends/legend-custom-definition-model');
var Validations = require('./legend-validations');
var Buffer = require('./legend-buffer');

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleModel,
  'category': CategoryModel,
  'choropleth': ChoroplethModel,
  'custom_choropleth': CustomChoroplethModel,
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

    add: function (model, callback) {
      var self = this;
      model.save(null, {
        success: function (model) {
          Buffer.remove(model);
          self.legendDefinitionsCollection.add(model);
        },
        complete: function () {
          callback && callback();
        }
      });
    },

    save: function (model, callback) {
      model.save(null, {complete: function (model) {
        callback && callback();
      }});
    },

    remove: function (model, callback) {
      var self = this;
      model.destroy({
        success: function (model) {
          self.legendDefinitionsCollection.remove(model);
        },
        complete: function () {
          callback && callback();
        }
      });
    },

    createLegend: function (layerDefModel, type, attrs, callback) {
      var model = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, type);
      var inQueue = Buffer.find(layerDefModel, type);
      var Klass;
      var validation = Validations[type];
      var isValid = validation(layerDefModel.styleModel);
      attrs = attrs || {};

      if (inQueue) {
        return inQueue;
      }

      if (!model) {
        Klass = LEGEND_MODEL_TYPE[type];
        model = new Klass(attrs, {
          layerDefinitionModel: layerDefModel,
          configModel: this.legendDefinitionsCollection.configModel,
          vizId: this.legendDefinitionsCollection.vizId,
          parse: true
        });

        if (isValid) {
          Buffer.add(model);
          this.add(model, callback);
        }
      } else {
        if (!isValid) {
          this.remove(model, callback);
        } else {
          model.set(attrs);
          this.save(model, callback);
        }
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
    },

    disableLegend: function (type) {
      this[type] = false;
    },

    enableLegend: function (type) {
      this[type] = true;
    },

    // By default, it's undefined so we are removing this condition from the equation
    isEnabledType: function (type) {
      return this[type] === undefined ? true : !!this[type];
    }
  };
})();

module.exports = manager;
