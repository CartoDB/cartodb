var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var nodeIds = require('./analysis-definition-node-ids.js');

var LAYER_TYPE_TO_LAYER_CREATE_METHOD = {
  'background': 'createBackgroundLayer',
  'cartodb': 'createCartoDBLayer',
  'gmaps': 'createGMapsBaseLayer',
  'plain': 'createPlainLayer',
  'tiled': 'createTileLayer',
  'torque': 'createTorqueLayer',
  'wms': 'createWMSLayer'
};

var TYPE_TO_KIND_MAP = {
  'CartoDB': 'carto',
  'Plain': 'background',
  'Tiled': 'tiled',
  'Torque': 'torque',
  'Wms': 'wms'
};

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  /**
   * Intended to be called from entry point, to make sure initial layers are taken into account
   */
  resetByLayersData: function (layersData) {
    this.reset(layersData, {
      silent: true,
      initialLetters: _.chain(layersData)
        .pluck('options')
        .pluck('letter')
        .compact()
        .value()
    });
  },

  comparator: function (m) {
    return -m.get('order');
  },

  model: function (d, opts) {
    var self = opts.collection;

    // Add data required for new editor if not set (e.g. a vis created on old editor doesn't contain letter and source)
    var o = _.clone(d.options || {});
    var attrs = _.defaults({ options: o }, _.omit(d, ['options']));

    if (!attrs.kind) {
      attrs.kind = TYPE_TO_KIND_MAP[o.type];
    }

    if (attrs.order !== 0) {
      // Only for non-basemap layers
      o.letter = o.letter || layerLetters.next(self._letters(opts.initialLetters));
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
    if (!options.vis) throw new Error('vis is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._vis = options.vis;
    this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;

    this.mapId = options.mapId;

    this.on('add', this._onAdd, this);
    this.on('sync', this._onSync, this);
    this.on('change', this._onChange, this);
    this.on('remove', this._onRemove, this);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/' + this.mapId + '/layers';
  },

  parse: function (r) {
    return r.layers;
  },

  _onAdd: function (m) {
    // If added but not yet saved, postpone the creation until persisted (see sync listener)
    if (!m.isNew()) {
      this._createLayer(m);
    }
  },

  _onSync: function (m) {
    if (!this._getLayer(m)) {
      this._createLayer(m);
    }
  },

  _onChange: function (m) {
    var attrs = m.changedAttributes();
    var layer = this._getLayer(m);

    if (!m.isNew()) {
      if (attrs.type) {
        // Should be ok to set silently, since we should no longer use kind in the rest of the editor code
        m.set('kind', TYPE_TO_KIND_MAP[attrs.type], {silent: true});
        layer.remove();
        this._createLayer(m);
      } else {
        layer.update(attrs);
      }
    }
  },

  _onRemove: function (m) {
    if (!m.isNew()) {
      this._getLayer(m).remove();
    }
  },

  _getLayer: function (m) {
    return this._vis.map.layers.get(m.id);
  },

  _createLayer: function (m) {
    var attrs = _.clone(m.attributes);

    var createMethodName = LAYER_TYPE_TO_LAYER_CREATE_METHOD[attrs.type.toLowerCase()];
    if (!createMethodName) throw new Error('no create method name found for type ' + attrs.type);

    var createMethod = this._vis.map[createMethodName];
    if (!_.isFunction(createMethod)) throw new Error(createMethodName + ' is not a function');

    createMethod.call(this._vis.map, attrs);
  },

  _letters: function (otherLetters) {
    var lettersFromAddedModels = _.compact(this.pluck('letter'));

    // When adding multiple items the models created so far are stored in the internal object this._byId,
    // need to make sure to take them into account when returning already taken letters.
    var lettersFromModelsNotYetAdded = _.chain(this._byId).values().invoke('get', 'letter').value();

    return _.union(lettersFromAddedModels, lettersFromModelsNotYetAdded, otherLetters);
  }

});
