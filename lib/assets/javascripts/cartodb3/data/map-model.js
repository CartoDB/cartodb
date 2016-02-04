var _ = require('underscore');
var cdb = require('cartodb.js');
var LayerDefinitionsCollection = require('./layer-definitions-collection');

/**
 * Model that represents a visualization's Map (v3)
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    this._baseUrl = opts.baseUrl;

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      // The layer definition URL is under the path of this model's API url
      // id might not be set from the beginning though, so the url needs to be constructed when needed
      baseUrl: this.url.bind(this)
    });
  },

  url: function () {
    var url = _.result(this, '_baseUrl') + '/api/v3/maps';
    return this.isNew()
      ? url
      : url + '/' + this.id;
  }

});
