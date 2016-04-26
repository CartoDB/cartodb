var cdb = require('cartodb.js');

/**
 * Model that represents a visualization's Map
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    var baseUrl = opts.configModel.get('base_url');
    this.urlRoot = baseUrl + '/api/v1/maps';

    this.layerDefinitionsCollection = opts.layerDefinitionsCollection;
  }

});
