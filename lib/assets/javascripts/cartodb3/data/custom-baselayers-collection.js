var Backbone = require('backbone');
var CustomBaselayerModel = require('./custom-baselayer-model');

module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;

    var m = new CustomBaselayerModel(d, {
      parse: true,
      collection: self
    });

    return m;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('user');
    return baseUrl + '/api/' + version + '/users/' + this._currentUserId + '/layers';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.currentUserId) throw new Error('currentUserId is required');

    this._configModel = opts.configModel;
    this._currentUserId = opts.currentUserId;
  },

  isCustomCategory: function () {
    var custom = this.where(function (mdl) {
      return ['NASA', 'TileJSON', 'WMS', 'Mapbox', 'Custom', undefined].some(function (category) {
        return mdl.get('category') === category;
      });
    });
    return custom;
  },

  getSelected: function () {
    return this.findWhere({ selected: true });
  },

  hasCustomBaseLayer: function (className) {
    if (!className) return;

    var customBaseLayer = this.where({ className: className });

    return customBaseLayer.length > 0;
  }

});
