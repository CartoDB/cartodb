var cdb = require('cartodb.js');
var _ = require('underscore');
var OWN_ATTRS = ['drag', 'id', 'keyboard', 'legends', 'scrollwheel'];
var DEBOUNCE_TIME = 1000;

/**
 * Model that represents a visualization's Map
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    drag: true,
    keyboard: true,
    legends: true,
    scrollwheel: false
  },

  parse: function (r) {
    return _.pick(r, OWN_ATTRS);
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.vis) throw new Error('vis is required');

    this._configModel = opts.configModel;
    this._mapModel = opts.vis.map;
    this._userModel = opts.userModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._initBinds();
  },

  _initBinds: function () {
    this._mapModel.bind('change:view_bounds_ne', _.debounce(this._onBoundsChanged, DEBOUNCE_TIME), this);
  },

  _onBoundsChanged: function () {
    this.save();
  },

  toJSON: function () {
    return _.extend(
      {},
      this.attributes,
      {
        attribution: _.unique(this._layerDefinitionsCollection.pluck('attribution')),
        center: this._mapModel.get('center'),
        minZoom: this._mapModel.get('minZoom'),
        maxZoom: this._mapModel.get('maxZoom'),
        provider: this._mapModel.get('provider'),
        view_bounds_ne: this._mapModel.get('view_bounds_ne'),
        view_bounds_sw: this._mapModel.get('view_bounds_sw'),
        zoom: this._mapModel.get('zoom'),
        user_id: this._userModel.get('id')
      }
    );
  }

});
