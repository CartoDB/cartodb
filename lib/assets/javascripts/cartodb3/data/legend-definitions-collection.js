var Backbone = require('backbone');
var _ = require('underscore');
var LegendDefModel = require('./legend-defintion-model');
var layerTypesAndKinds = require('./layer-types-and-kinds');

module.exports = Backbone.Collection.extend({
  model: LegendDefModel,

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this.configModel = options.configModel;
    this.layerDefinitionsCollection = options.layerDefinitionsCollection;
  },

  url: function () {
    var mapId = this.layerDefinitionModel.collection.mapId;
    var baseUrl = this.configModel.get('base_url');
    // TOFIX WHEN THE API IS READY
    return baseUrl + '/api/v1/maps/' + mapId + '/layers/' + this.layerId + '/legends';
  },

  /**
   * Intended to be called from entry point, to make sure initial layers are taken into account
   */
  resetByLayersData: function (vizJSON) {
    var models = [];
    var layers = _.filter(vizJSON.layers, function (layer) {
      return this._isDataLayer(layer.type);
    }, this);

    _.each(layers, function (layer) {
      var layerDefModel = this._findLayerDefinitionModel(layer.id);
      var legends = layer.legends.map(function (legend) {
        return new LegendDefModel(legend, {
          layerDefinitionModel: layerDefModel
        });
      });

      models.push(legends);
    }, this);

    this.reset(_.flatten(models), {
      silent: true
    });
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
  }
});
