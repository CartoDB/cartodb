var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var LayerLetters = require('./layer-letters');

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

    // E.g. basemap should not have a letter representation
    if (o.type !== 'Tiled') {
      o.letter = o.letter || self._letters.next();
    }

    if (o.table_name) {
      // Create source attr if it does not already exist
      o.source = o.source || o.letter + '0';

      // Add analysis definition unless already existing (matched by the source id)
      self._analysisDefinitionsCollection.add({
        id: o.source,
        type: 'source',
        params: _.pick(o, ['table_name', 'query'])
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
    if (!options.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._layersCollection = options.layersCollection;
    this._analysisDefinitionsCollection = options.analysisDefinitionsCollection;

    // A collection may be reset at any time (actually used silently when collection is created),
    // to be able to know what letter representation should be generated in nextLetter we store them in this internal
    // data structure.
    this._letters = new LayerLetters();

    this.mapId = options.mapId;
    this.on('remove', this._onRemove, this);
    this.listenTo(this._analysisDefinitionsCollection, 'remove', this._onAnalysisRemove);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/' + this.mapId + '/layers';
  },

  parse: function (r) {
    return r.layers;
  },

  _onRemove: function (m) {
    this._letters.remove(m.get('letter'));
  },

  _onAnalysisRemove: function (m) {
    var affectedLayers = this.where({ source: m.id });

    var sourceModel = m.sourceModel();
    if (sourceModel) {
      _.invoke(affectedLayers, 'save', {source: sourceModel.id});
    } else {
      // No source model, i.e. the removed analysis must have a root analysis model (i.e. type 'source')
      _.invoke(affectedLayers, 'unset', 'source');
    }
  }

});
