var Backbone = require('backbone');
var _ = require('underscore');
var WMSView = require('./wms-view.js');
var LayersCollection = require('./layers-collection.js');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS',
    currentView: 'enterURL', // [fetchingLayers, selectLayer, savingLayer]
    layersFetched: false,
    layer: undefined, // will be set when selected
    customBaselayersCollection: undefined // expected when instantiated
  },

  initialize: function () {
    this.layers = new LayersCollection();

    this._initBinds();
  },

  createView: function () {
    this.set({
      currentView: 'enterURL',
      layersFetched: false
    });
    return new WMSView({
      model: this
    });
  },

  fetchLayers: function (url) {
    var self = this;

    this.set('currentView', 'fetchingLayers');

    this.layers.fetch(url, function () {
      self.set({
        currentView: self.layers.length > 0 ? 'selectLayer' : 'enterURL',
        layersFetched: true
      });
    });
  },

  layersAvailableCount: function () {
    return _.difference(
      this.layers.pluck('title'),
      this.get('customBaselayersCollection').pluck('name')
    ).length;
  },

  get: function (name) {
    if (name === 'layer') {
      return this.layers
        .find(function (mdl) {
          return mdl.get('state') === 'saveDone';
        })
        .get('customBaselayerModel');
    } else {
      return Backbone.Model.prototype.get.apply(this, arguments);
    }
  },

  getLayers: function () {
    if (this.get('searchQuery')) {
      var regExp = new RegExp(this.get('searchQuery'), 'i');
      return this.layers.filter(function (layer) {
        return layer.get('name').match(regExp);
      }, this);
    } else {
      return this.layers;
    }
  },

  hasAlreadyAddedLayer: function () {
    // Already added layers are disabled to be saved for each layer
    return false;
  },

  _initBinds: function () {
    this.layers.bind('change:state', this._onLayerStateChange, this);
  },

  _onLayerStateChange: function (mdl, newState) {
    switch (newState) {
      case 'saving':
        this.set('currentView', 'savingLayer');
        break;
      case 'saveDone':
        this.set('layer', mdl.get('customBaselayerModel'));
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
