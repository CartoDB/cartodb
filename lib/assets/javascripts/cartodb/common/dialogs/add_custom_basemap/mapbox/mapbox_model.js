var cdb = require('cartodb.js');
var MapboxView = require('./mapbox_view');

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'mapbox',
    label: 'Mapbox',
    currentView: 'enterURL', //, validatingInputs, valid
    layer: undefined // will be set when valid
  },

  createView: function() {
    this.set({
      currentView: 'enterURL',
      layer: undefined
    });
    return new MapboxView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function(baseLayers) {
    // TODO: implement how?
    return false;
  },

  save: function() {
    this.set('currentView', 'validatingInputs');
  }
});
