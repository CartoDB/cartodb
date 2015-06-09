var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Model for an individual WMS/WMTS layer.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    state: 'idle', //, saving, saveDone, saveFail
    layer: undefined // set after saveDone
  },

  canSave: function(baseLayers) {
    return !_.any(baseLayers.custom(), function(customLayer) {
      return customLayer.get('name') === this.get('title');
    }, this);
  },

  save: function() {
    this.set('state', 'saving');

    var w = new cdb.admin.WMSService({
      wms_url: this.url(),
      title: this.get('title'),
      name: this.get('name'),
      layer: this.get('name'),
      srs: this.get('srs'),
      bounding_boxes: this.get('llbbox')
    });

    // TODO: remove mixpanel
    cdb.god.trigger('mixpanel', 'WMS layer selected', w.attributes);

    // Event tracking "WMS layer selected"
    cdb.god.trigger('metrics', 'select_wms', {
      email: window.user_data.email,
      data: w.attributes
    });

    var self = this;
    w.save({}, {
      success: function(m) {
        var tileLayer;
        try {
          tileLayer = m.newTileLayer();
        } catch (err) {
        }
        if (tileLayer) {
          self.set({
            state: 'saveDone',
            tileLayer: tileLayer
          });
        } else {
          self.set('state', 'saveFail');
        }
      },
      error: function() {
        self.set('state', 'saveFail');
      }
    });
  }
});
