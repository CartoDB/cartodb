var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Backbone = require('backbone');
var CustomBaselayerModel = require('../../../../data/custom-baselayer-model');
var WMSService = require('../../../../data/wms-service-model');

/**
 * Model for an individual WMS/WMTS layer.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    state: 'idle', //, saving, saveDone, saveFail
    layer: undefined // set after saveDone
  },

  canSave: function (baseLayers) {
    return !_.any(baseLayers.custom(), function (customLayer) {
      return customLayer.get('name') === this.get('title');
    }, this);
  },

  save: function () {
    this.set('state', 'saving');
    this._shouldBeProxied() ? this._createProxiedLayer() : this._newTileLayer();
  },

  _shouldBeProxied: function () {
    if (this.get('type') === 'wmts') {
      var supportedMatrixSets = WMSService.supportedMatrixSets(this.get('matrix_sets') || []);
      return supportedMatrixSets.length > 0;
    }
    return true;
  },

  _createProxiedLayer: function () {
    var self = this;
    var w = new WMSService({
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
    // cdb.god.trigger('metrics', 'select_wms', {
    //   email: window.user_data.email
    // });

    w.save({}, {
      success: function (m) {
        var tileLayer;
        try {
          tileLayer = m.newTileLayer();
        } catch (e) {
        }
        if (tileLayer) {
          self._setNewTileLayer(tileLayer);
        } else {
          self.set('state', 'saveFail');
        }
      },
      error: function () {
        self.set('state', 'saveFail');
      }
    });

    return w;
  },

  _setNewTileLayer: function (tileLayer) {
    this.set({
      state: 'saveDone',
      tileLayer: tileLayer
    });
  },

  _byCustomURL: function (url, tms) {
    // Minimal test for "valid URL" w/o having to complicate it with regex
    if (url && url.indexOf('/') === -1) throw new TypeError('invalid URL');

    // Only lowercase the placeholder variables, since the URL may contain case-sensitive data (e.g. API keys and such)
    url = url.replace(/\{S\}/g, '{s}')
      .replace(/\{X\}/g, '{x}')
      .replace(/\{Y\}/g, '{y}')
      .replace(/\{Z\}/g, '{z}');

    var layer = new CustomBaselayerModel({
      urlTemplate: url,
      attribution: null,
      maxZoom: 21,
      minZoom: 0,
      name: '',
      tms: tms,
      category: 'Custom',
      type: 'Tiled'
    });

    return layer;
  },

  _newTileLayer: function () {
    var tileLayer = this._byCustomURL(this._xyzURLTemplate(), false);
    tileLayer.set({
      name: this.get('title') || this.get('name'),
      attribution: this.get('attribution'),
      bounding_boxes: this.get('llbbox')
    });
    this._setNewTileLayer(tileLayer);
    return tileLayer;
  },

  _xyzURLTemplate: function () {
    var urlTemplate = this.get('url_template') || '';
    // Convert the proxy template variables to XYZ format, http://foo.com/bar/%%(z)s/%%(x)s/%%(y)s.png"
    return urlTemplate.replace(/%%\((\w)\)s/g, '{$1}');
  }

});
