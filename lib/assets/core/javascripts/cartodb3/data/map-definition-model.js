var Backbone = require('backbone');
var _ = require('underscore');
var OWN_ATTRS = ['drag', 'id', 'keyboard'];
var EMBED_ATTRS = ['legends', 'scrollwheel', 'layer_selector', 'dashboard_menu'];

/**
 * Model that represents a visualization's Map
 */
module.exports = Backbone.Model.extend({

  defaults: {
    drag: true,
    keyboard: true,
    cartodb_logo: false,
    legends: true,
    layer_selector: false,
    dashboard_menu: true,
    scrollwheel: true
  },

  parse: function (r) {
    return _.extend({},
      _.pick(r, OWN_ATTRS),
      _.pick(r.options, EMBED_ATTRS)
    );
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v2/maps/';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._layerDefinitionsCollection.bind('baseLayerChanged', this._saveMaxMinZoom, this);
  },

  _saveMaxMinZoom: function () {
    var baseLayer = this._layerDefinitionsCollection.getBaseLayer();
    this.save({
      minZoom: baseLayer.get('minZoom'),
      maxZoom: baseLayer.get('maxZoom')
    });
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, EMBED_ATTRS),
      {
        attribution: _.unique(this._layerDefinitionsCollection.pluck('attribution')),
        user_id: this._userModel.get('id')
      },
      {
        options: _.pick(this.attributes, EMBED_ATTRS)
      }
    );
  }
});
