var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  model: LayerDefinitionModel,

  initialize: function (models, options) {
    if (!options.baseUrl) throw new Error('baseUrl is required');
    if (!options.mapId) throw new Error('mapId is required');
    if (!options.tablesCollection) throw new Error('tablesCollection is required');
    if (!options.layersCollection) throw new Error('layersCollection is required');
    this._baseUrl = options.baseUrl;
    this._mapId = options.mapId;
    this._tablesCollection = options.tablesCollection;
    this._layersCollection = options.layersCollection;
  },

  url: function () {
    return _.result(this, '_baseUrl') + '/api/v1/maps/' + this._mapId + '/layers';
  },

  parse: function (r) {
    return _.map(r.layers, function (d) {
      var layerModel = this._layersCollection.get(d.id);
      return new LayerDefinitionModel(d, {
        tablesCollection: this._tablesCollection,
        layerModel: layerModel
      });
    }, this);
  }

});
