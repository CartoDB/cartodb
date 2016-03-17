var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var nodeIds = require('./analysis-definition-node-ids.js');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  comparator: function (m) {
    return -m.get('order');
  },

  model: function (d, opts) {
    var self = opts.collection;

    // Add data required for new editor if not set (e.g. a vis created on old editor doesn't contain letter and source)
    var o = _.clone(d.options || {});
    var attrs = _.defaults({ options: o }, _.omit(d, ['options']));

    if (attrs.order !== 0) {
      // Only for non-basemap layers
      o.letter = o.letter || layerLetters.next(self._letters());
    }

    if (o.table_name) {
      // Create source attr if it does not already exist
      var sourceId = nodeIds.next(o.letter);
      o.source = o.source || sourceId;

      // Add analysis definition unless already existing
      self._analysisDefinitionNodesCollection.add({
        id: sourceId,
        type: 'source',
        params: {
          query: o.query || 'SELECT * FROM ' + o.table_name
        }
      });
    }

    var m = new LayerDefinitionModel(attrs, {
      parse: true, // make sure data is structured as expected
      collection: self,
      configModel: self._configModel
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layersCollection) throw new Error('layersCollection is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._layersCollection = options.layersCollection;
    this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;

    this.mapId = options.mapId;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/' + this.mapId + '/layers';
  },

  parse: function (r) {
    return r.layers;
  },

  _letters: function () {
    var modelsLetters = _.compact(this.pluck('letter'));

    // When adding multiple items the models created so far are stored in the internal object this._byId,
    // need to make sure to take them into account when returning already taken letters.
    return _
        .chain(this._byId)
        .values()
        .invoke('get', 'letter')
        .union(modelsLetters)
        .value();
  }

});
