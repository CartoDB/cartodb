var Backbone = require('backbone');
var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var layerTypesAndKinds = require('builder/data/layer-types-and-kinds');

var CategoryModel = require('./legend-category-definition-model');
var BubbleModel = require('./legend-bubble-definition-model');
var ChoroplethModel = require('./legend-choropleth-definition-model');
var CustomChoroplethModel = require('./legend-custom-choropleth-definition-model');
var CustomModel = require('./legend-custom-definition-model');
var TorqueModel = require('./legend-torque-definition-model');

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleModel,
  'category': CategoryModel,
  'choropleth': ChoroplethModel,
  'custom_choropleth': CustomChoroplethModel,
  'custom': CustomModel,
  'html': CustomModel,
  'torque': TorqueModel
};

module.exports = Backbone.Collection.extend({
  model: LegendBaseDefModel,

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!options.vizId) throw new Error('vizId is required');

    this.configModel = options.configModel;
    this.layerDefinitionsCollection = options.layerDefinitionsCollection;
    this.vizId = options.vizId;
  },

  /**
   * Intended to be called from entry point, to make sure initial layers are taken into account
   */
  resetByData: function (vizJSON) {
    var models = [];
    var layers = _.filter(vizJSON.layers, function (layer) {
      return this._isDataLayer(layer.type);
    }, this);

    _.each(layers, function (layer) {
      var layerDefModel = this._findLayerDefinitionModel(layer.id);
      var legends = [];
      if (layer.legends) {
        legends = layer.legends.map(function (legend) {
          var Klass = LEGEND_MODEL_TYPE[legend.type];

          return new Klass(legend, {
            layerDefinitionModel: layerDefModel,
            configModel: this.configModel,
            vizId: this.vizId,
            parse: true
          });
        }, this);
      }

      models.push(legends);
    }, this);

    this.reset(_.flatten(models));
  },

  fetch: function () {
    throw new Error('This collection should not make any fetch calls. It should be populated from the vizJSON.');
  },

  _isDataLayer: function (layerType) {
    return layerTypesAndKinds.isCartoDBType(layerType) ||
      layerTypesAndKinds.isTorqueType(layerType);
  },

  _findLayerDefinitionModel: function (id) {
    return this.layerDefinitionsCollection.findWhere({id: id});
  },

  findByLayerDefModel: function (layerDefModel) {
    var id = layerDefModel.id;
    return this.filter(function (legendDefModel) {
      var layerDefModel = legendDefModel.layerDefinitionModel;
      return layerDefModel.id === id;
    });
  },

  findByLayerDefModelAndType: function (layerDefModel, type) {
    var id = layerDefModel.id;
    return this.find(function (legendDefModel) {
      var layerDefModel = legendDefModel.layerDefinitionModel;
      return layerDefModel.id === id && legendDefModel.get('type') === type;
    });
  },

  findByLayerDefModelAndTypes: function (layerDefModel, types) {
    var id = layerDefModel.id;
    return this.filter(function (legendDefModel) {
      var layerDefModel = legendDefModel.layerDefinitionModel;
      var type = legendDefModel.get('type');
      return layerDefModel.id === id && types.indexOf(type) !== -1;
    });
  }
});
