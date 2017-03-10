var _ = require('underscore');
var Backbone = require('backbone');
var WMSLayerModel = require('./wms-layer-model');

module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    var self = opts.collection;

    return new WMSLayerModel(attrs, {
      wmsService: self._wmsService
    });
  },

  parse: function (r) {
    var layers = [];

    if (r.layers) {
      layers = _.map(r.layers, function (layer) {
        return _.extend({ type: r.type || 'wms' }, layer);
      });
    }

    return layers;
  },

  sync: function (method, model, options) {
    options = options || {};
    options.url = this.url(method.toLowerCase());
    options.dataType = 'jsonp';
    method = 'READ';

    return Backbone.sync.apply(this, arguments);
  },

  url: function () {
    return this._wmsService.getFetchLayersURL();
  },

  initialize: function (models, opts) {
    if (!opts.wmsService) throw new Error('wmsService is required');

    this._wmsService = opts.wmsService;
  }

});
