var Backbone = require('backbone');
var _ = require('underscore');
var WMSView = require('./wms-view');
var WMSLayersCollection = require('./wms-layers-collection');
var WMSService = require('builder/data/wms-service');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS',
    currentView: 'enterURL', // [fetchingLayers, selectLayer, savingLayer]
    layersFetched: false,
    layer: undefined // will be set when selected
  },

  initialize: function (attrs, opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');

    this._customBaselayersCollection = opts.customBaselayersCollection;

    this.wmsService = new WMSService();
    this.wmsLayersCollection = new WMSLayersCollection(null, {
      wmsService: this.wmsService
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.wmsLayersCollection.bind('change:state', this._onLayerStateChange, this);
    this.wmsLayersCollection.bind('reset', function () {
      this.set({
        currentView: this.wmsLayersCollection.length > 0 ? 'selectLayer' : 'enterURL',
        layersFetched: true
      });

      this.trigger('layersFetched');
    }, this);
  },

  createView: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.modalFooter) throw new Error('modalFooter is required');

    this._submitButton = opts.submitButton;
    this._modalFooter = opts.modalFooter;

    this.set({
      currentView: 'enterURL',
      layersFetched: false
    });

    return new WMSView({
      model: this,
      customBaselayersCollection: this._customBaselayersCollection,
      submitButton: this._submitButton,
      modalFooter: this._modalFooter
    });
  },

  fetchLayers: function (url) {
    this.set('currentView', 'fetchingLayers');

    this.wmsService.setUrl(url);

    this.wmsLayersCollection.fetch({
      reset: true
    });
  },

  layersAvailableCount: function () {
    return _.difference(
      this.wmsLayersCollection.pluck('title'),
      this._customBaselayersCollection.pluck('name')
    ).length;
  },

  get: function (name) {
    if (name === 'layer') {
      var customBaselayerModel = this.wmsLayersCollection.find(function (mdl) {
        return mdl.get('state') === 'saveDone';
      });

      return customBaselayerModel && customBaselayerModel.get('customBaselayerModel');
    } else {
      return Backbone.Model.prototype.get.apply(this, arguments);
    }
  },

  getLayers: function () {
    if (this.get('searchQuery')) {
      var regExp = new RegExp(this.get('searchQuery'), 'i');

      return this.wmsLayersCollection.filter(function (layer) {
        return layer.get('name').match(regExp);
      }, this);
    } else {
      return this.wmsLayersCollection;
    }
  },

  hasAlreadyAddedLayer: function () {
    // Already added layers are disabled to be saved for each layer
    return false;
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
