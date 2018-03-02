var _ = require('underscore');
var Backbone = require('backbone');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

/**
 * Model for an individual WMS/WMTS layer.
 */

module.exports = Backbone.Model.extend({

  defaults: {
    state: 'idle' // idle, saving, saveDone, saveFail
  },

  url: function () {
    return this._wmsService.saveLayerURL({
      title: this.get('title'),
      name: this.get('name'),
      layer: this.get('name'),
      srs: this.get('srs'),
      bounding_boxes: this.get('llbbox'),
      type: this.get('type'), // wms/wmts
      matrix_sets: this.get('matrix_sets')
    });
  },

  sync: function (method, model, options) {
    options = options || {};
    options.url = this.url(method.toLowerCase());
    options.dataType = 'jsonp';
    method = 'READ';

    return Backbone.sync.apply(this, arguments);
  },

  initialize: function (attrs, opts) {
    if (!opts.wmsService) throw new Error('wmsService is required');

    this._wmsService = opts.wmsService;
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

  _shouldBeProxied: function () {
    if (this.get('type') === 'wmts') {
      var supportedMatrixSets = this._wmsService.supportedMatrixSets(this.get('matrix_sets') || []);

      return supportedMatrixSets.length > 0;
    }

    return true;
  },

  _createProxiedLayer: function () {
    var self = this;

    this.save({}, {
      success: function () {
        var proxiedBaselayerModel;

        try {
          proxiedBaselayerModel = self._newProxiedBaselayerModel();
        } catch (e) {
        }

        if (proxiedBaselayerModel) {
          self._setCustomBaselayerModel(proxiedBaselayerModel);
        } else {
          self.set('state', 'saveFail');
        }
      },
      error: function (e) {
        self.set('state', 'saveFail');
      }
    });
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

  _newProxiedBaselayerModel: function () {
    if (!this.get('mapproxy_id')) {
      throw new Error('mapproxy_id must be set');
    }

    var url = this._wmsService.getProxyTilesURL() + '/' + this.get('mapproxy_id') + '/wmts/map/webmercator/{z}/{x}/{y}.png';
    var proxiedBaselayerModel = this._generateCustomBaselayerModel(url);

    proxiedBaselayerModel.set({
      name: this.get('title') || this.get('name'),
      attribution: this.get('attribution'),
      proxy: true,
      bounding_boxes: this.get('bounding_boxes')
    });

    return proxiedBaselayerModel;
  },

  _generateCustomBaselayerModel: function (url) {
    var layer = new CustomBaselayerModel({
      urlTemplate: url,
      attribution: null,
      maxZoom: 21,
      minZoom: 0,
      name: '',
      category: 'WMS',
      tms: false,
      type: 'Tiled'
    });
    layer.set('className', layer._generateClassName(url));

    return layer;
  },

  _byCustomURL: function (url) {
    // Minimal test for "valid URL" w/o having to complicate it with regex
    if (url && url.indexOf('/') === -1) throw new TypeError('invalid URL');

    // Only lowercase the placeholder variables, since the URL may contain case-sensitive data (e.g. API keys and such)
    url = url.replace(/\{S\}/g, '{s}')
      .replace(/\{X\}/g, '{x}')
      .replace(/\{Y\}/g, '{y}')
      .replace(/\{Z\}/g, '{z}');

    var layer = this._generateCustomBaselayerModel(url);

    return layer;
  },

  _xyzURLTemplate: function () {
    var urlTemplate = this.get('url_template') || '';
    // Convert the proxy template variables to XYZ format, http://foo.com/bar/%%(z)s/%%(x)s/%%(y)s.png"
    return urlTemplate.replace(/%%\((\w)\)s/g, '{$1}');
  },

  _setCustomBaselayerModel: function (customBaselayerModel) {
    this.set({
      state: 'saveDone',
      customBaselayerModel: customBaselayerModel
    });
  }

});
