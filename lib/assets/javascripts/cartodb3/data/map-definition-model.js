var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Model that represents a visualization's Map
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    this.urlRoot = _.result(opts, 'baseUrl') + '/api/v1/maps';
    this.layerDefinitionsCollection = opts.layerDefinitionsCollection;
  }

});
