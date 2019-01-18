var Backbone = require('backbone');
var _ = require('underscore');
var MapboxView = require('./mapbox-view');
var MapboxToTileLayerFactory = require('./mapbox-to-tile-layer-factory');

/**
 * View model for Mapbox tab content.
 */

module.exports = Backbone.Model.extend({

  defaults: {
    name: 'mapbox',
    label: 'Mapbox',
    currentView: 'enterURL', //, validatingInputs, valid
    lastErrorMsg: '', // set if fails to save
    layer: undefined // will be set when valid
  },

  createView: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.modalFooter) throw new Error('modalFooter is required');

    this._submitButton = opts.submitButton;
    this._modalFooter = opts.modalFooter;

    this.set({
      currentView: 'enterURL',
      layer: undefined
    });

    return new MapboxView({
      model: this,
      submitButton: this._submitButton,
      modalFooter: this._modalFooter
    });
  },

  hasAlreadyAddedLayer: function (userLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(userLayers.isCustomCategory(), function (customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  },

  validateInputs: function (url) {
    this.set({
      currentView: 'validatingInputs',
      url: url
    });

    var self = this;

    var mf = new MapboxToTileLayerFactory({
      url: url
    });
    mf.createTileLayer({
      success: function (tileLayer) {
        self.set('layer', tileLayer);
        self.trigger('saveBasemap');
      },
      error: function (errorMsg) {
        self.set({
          currentView: 'enterURL',
          lastErrorMsg: errorMsg
        });
      }
    });
  }

});
