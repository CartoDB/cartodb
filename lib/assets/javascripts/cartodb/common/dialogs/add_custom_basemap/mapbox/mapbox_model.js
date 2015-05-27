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
    lastErrorMsg: '', //set if fails to save
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

  save: function(url, accessToken) {
    this.set('currentView', 'validatingInputs');

    var self = this;
    var mf = new cdb.editor.MapboxToTileLayerFactory({
      url: url,
      accessToken: accessToken
    });
    mf.createTileLayer({
      success: function(tileLayer) {
        self.set('layer', tileLayer);
        self.trigger('saveBasemap');
      },
      error: function(errorMsg) {
        self.set({
          currentView: 'enterURL',
          lastErrorMsg: errorMsg
        });
      }
    });
  }
});
