var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var WMSView = require('./wms_view.js');
var LayersCollection = require('./layers_collection.js');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS',
    currentView: 'enterURL', // [fetchingLayers, selectLayer, savingLayer]
    layersFetched: false,
    layers: undefined,
    baseLayers: undefined // expected when instantiated
  },

  initialize: function() {
    this.elder('initialize');
    this.set('layers', new LayersCollection());
    this._initBinds();
  },

  createView: function() {
    this.set({
      currentView: 'enterURL',
      layersFetched: false
    });
    return new WMSView({
      model: this
    });
  },

  fetchLayers: function(url) {
    this.set('currentView', 'fetchingLayers');
    var self = this;
    this.get('layers').fetch(url, function() {
      self.set({
        currentView: self.get('layers').length > 0 ? 'selectLayer' : 'enterURL',
        layersFetched: true
      });
    });
  },

  layersAvailableCount: function() {
    return _.difference(
      this.get('layers').pluck('title'),
      this.get('baseLayers').pluck('name')
    ).length;
  },

  get: function(name) {
    if (name === 'layer') {
      return this.get('layers')
        .find(function(m) {
          return m.get('state') === 'saveDone';
        })
        .get('tileLayer');
    } else {
      return cdb.core.Model.prototype.get.apply(this, arguments);
    }
  },

  getLayers: function() {
    if (this.get("searchQuery")) {
      var regExp = new RegExp(this.get("searchQuery"), 'i');
      return this.get("layers").filter(function(layer) {
        return layer.get("name").match(regExp);
      }, this);
    } else {
      return this.get("layers");
    }
  },

  hasAlreadyAddedLayer: function() {
    // Already added layers are disabled to be saved for each layer
    return false;
  },

  _initBinds: function() {
    this.get('layers').bind('change:state', this._onLayerStateChange, this);
  },

  _onLayerStateChange: function(_, newState) {
    switch (newState) {
      case 'saving':
        this.set('currentView', 'savingLayer');
        break;
      case 'saveDone':
        this.trigger('saveBasemap');
        break;
      case 'saveFail':
      this.set('currentView', 'saveFail');
        break;
      default:
        this.set('currentView', 'selectLayer');
    }
  }

});
