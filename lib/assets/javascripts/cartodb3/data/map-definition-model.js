var Backbone = require('backbone');
var _ = require('underscore');
var OWN_ATTRS = ['drag', 'id', 'keyboard', 'legends', 'scrollwheel'];

/**
 * Model that represents a visualization's Map
 */
module.exports = Backbone.Model.extend({

  defaults: {
    drag: true,
    keyboard: true,
    cartodb_logo: false,
    legends: false,
    scrollwheel: false
  },

  parse: function (r) {
    return _.pick(r, OWN_ATTRS);
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
  },

  toJSON: function () {
    return _.extend(
      {},
      this.attributes,
      {
        attribution: _.unique(this._layerDefinitionsCollection.pluck('attribution')),
        user_id: this._userModel.get('id')
      }
    );
  }
});
