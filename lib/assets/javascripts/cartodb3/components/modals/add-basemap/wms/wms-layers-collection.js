var Backbone = require('backbone');
var WMSLayerModel = require('./wms-layer-model');

module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    var self = opts.collection;

    return new WMSLayerModel(attrs, {
      wmsService: self._wmsService,
      wmsType: self._type
    });
  },

  parse: function (r) {
    if (r.layers) {
      this._type = r.type;

      return r.layers;
    }
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

    this._type = 'wms';

    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (mdl, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== mdl.cid && m.get('selected')) {
          m.set('selected', false);
        }
      });
    }
  }

});
