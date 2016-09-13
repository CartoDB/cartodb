var _ = require('underscore-cdb-v3');
var Backbone = require('backbone');
var CustomBaselayerModel = require('../../../../data/custom-baselayer-model');
var WMSServiceModel = require('../../../../data/wms-service-model');

/**
 * Model for an individual WMS/WMTS layer.
 */
module.exports = Backbone.Model.extend({

  _SUPPORTED_MATRIX_SETS: [
    'EPSG:4326',
    'EPSG:4258'
  ],

  defaults: {
    state: 'idle', //, saving, saveDone, saveFail
    layer: undefined // set after saveDone
  },

  canSave: function (customBaselayersCollection) {
    return !_.any(customBaselayersCollection.isCustomCategory(), function (customLayer) {
      return customLayer.get('name') === this.get('title');
    }, this);
  },

  createProxiedLayerOrCustomBaselayerModel: function () {
    this.set('state', 'saving');
    this._shouldBeProxied() ? this._createProxiedLayer() : this._newCustomBaselayerModel();
  },

  _supportedMatrixSets: function (matrixSets) {
    return _.intersection(matrixSets, this._SUPPORTED_MATRIX_SETS);
  },

  _shouldBeProxied: function () {
    if (this.get('type') === 'wmts') {
      var supportedMatrixSets = this._supportedMatrixSets(this.get('matrix_sets') || []);

      return supportedMatrixSets.length > 0;
    }

    return true;
  },

  _createProxiedLayer: function () {
    var self = this;

    this.wms = new WMSServiceModel({
      wms_url: this.url(),
      title: this.get('title'),
      name: this.get('name'),
      layer: this.get('name'),
      srs: this.get('srs'),
      bounding_boxes: this.get('llbbox'),
      type: this.get('type'), // wms/wmts
      matrix_sets: this.get('matrix_sets')
    });

    this.wms.save({}, {
      success: function (mdl) {
        var customBaselayerModel;

        try {
          customBaselayerModel = mdl.newCustomBaselayerModel();
        } catch (e) {
        }

        if (customBaselayerModel) {
          self._setCustomBaselayerModel(customBaselayerModel);
        } else {
          self.set('state', 'saveFail');
        }
      },
      error: function () {
        self.set('state', 'saveFail');
      }
    });

    return this.wms;
  },

  _setCustomBaselayerModel: function (customBaselayerModel) {
    this.set({
      state: 'saveDone',
      customBaselayerModel: customBaselayerModel
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
      tms: false,
      category: 'Custom',
      type: 'Tiled'
    });
    layer.set('className', layer._generateClassName(url));

    return layer;
  },

  _newCustomBaselayerModel: function () {
    var customBaselayerModel = this._byCustomURL(this._xyzURLTemplate());

    customBaselayerModel.set({
      name: this.get('title') || this.get('name'),
      attribution: this.get('attribution'),
      bounding_boxes: this.get('llbbox')
    });
    this._setCustomBaselayerModel(customBaselayerModel);

    return customBaselayerModel;
  },

  _xyzURLTemplate: function () {
    var urlTemplate = this.get('url_template') || '';
    // Convert the proxy template variables to XYZ format, http://foo.com/bar/%%(z)s/%%(x)s/%%(y)s.png"
    return urlTemplate.replace(/%%\((\w)\)s/g, '{$1}');
  }

});
