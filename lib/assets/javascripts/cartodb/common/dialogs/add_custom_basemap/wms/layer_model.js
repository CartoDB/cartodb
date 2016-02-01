var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

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
    this._shouldBeProxied() ? this._createProxiedLayer() : this._newTileLayer();
  },

  _shouldBeProxied: function() {
    if (this.get('type') === 'wmts') {
      var supportedMatrixSets = cdb.admin.WMSService.supportedMatrixSets(this.get('matrix_sets') || []);
      return supportedMatrixSets.length > 0;
    }
    return true;
  },

  _createProxiedLayer: function() {
    var self = this;
    var w = new cdb.admin.WMSService({
      wms_url: this.url(),
      title: this.get('title'),
      name: this.get('name'),
      layer: this.get('name'),
      srs: this.get('srs'),
      bounding_boxes: this.get('llbbox'),
      type: this.get('type'), // wms/wmts
      matrix_sets: this.get('matrix_sets')
    });

    // Event tracking "WMS layer selected"
    cdb.god.trigger('metrics', 'select_wms', {
      email: window.user_data.email
    });

    var self = this;
    w.save({}, {
      success: function(m) {
        var tileLayer;
        try {
          tileLayer = m.newTileLayer();
        } catch(e) {
        }
        if (tileLayer) {
          self._setNewTileLayer(tileLayer);
        } else {
          self.set('state', 'saveFail');
        }
      },
      error: function() {
        self.set('state', 'saveFail');
      }
    });

    return w;
  },

  _setNewTileLayer: function(tileLayer) {
    this.set({
      state: 'saveDone',
      tileLayer: tileLayer
    });
  },

  _newTileLayer: function() {
    var tileLayer = cdb.admin.TileLayer.byCustomURL(this._xyzURLTemplate(), false);
    tileLayer.set({
      name: this.get('title') || this.get('name'),
      attribution: this.get('attribution'),
      bounding_boxes: this.get('llbbox')
    });
    this._setNewTileLayer(tileLayer);
    return tileLayer;
  },

  _xyzURLTemplate: function() {
    var urlTemplate = this.get('url_template') || '';
    // Convert the proxy template variables to XYZ format, http://foo.com/bar/%%(z)s/%%(x)s/%%(y)s.png"
    return urlTemplate.replace(/%%\((\w)\)s/g, '{$1}');
  }

});
