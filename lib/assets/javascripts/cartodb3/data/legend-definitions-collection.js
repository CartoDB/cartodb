var Backbone = require('backbone');
var _ = require('underscore');
var LegendModel = require('./legend-defintion-model');

module.exports = Backbone.Collection.extend({
  model: function (d, opts) {
    var self = opts.collection;
    var attrs = _.extend(d, {
      styleModel: self.layerDefinitionModel.styleModel
    });

    var m = new LegendModel(attrs, {
      collection: self
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this.configModel = options.configModel;
    this.layerDefinitionModel = options.layerDefinitionModel;
  },

  url: function () {
    var mapId = this.layerDefinitionModel.collection.mapId;
    var baseUrl = this.configModel.get('base_url');
    // TOFIX WHEN THE API IS READY
    return baseUrl + '/api/v1/maps/' + mapId + '/layers/' + this.layerId + '/legends';
  },

  parse: function (r) {
    return r.legends;
  }
});
