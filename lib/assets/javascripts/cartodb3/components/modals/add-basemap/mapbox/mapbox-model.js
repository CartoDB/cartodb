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

  createView: function () {
    this.set({
      currentView: 'enterURL',
      layer: undefined
    });
    return new MapboxView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function (userLayers) {
    var urlTemplate = this.get('layer').urlTemplate;
    return _.any(userLayers.custom(), function (customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  },

  save: function (url, accessToken) {
    this.set({
      currentView: 'validatingInputs',
      url: url,
      accessToken: accessToken
    });

    var self = this;

    var mf = new MapboxToTileLayerFactory({
      url: url,
      accessToken: accessToken
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
