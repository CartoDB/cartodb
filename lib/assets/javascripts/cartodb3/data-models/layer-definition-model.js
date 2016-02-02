var cdb = require('cartodb.js');

/**
 * Model to edit a layer definition
 */
module.exports = cdb.core.Model.extend({
  initialize: function (attrs, opts) {
    this.layerModel = opts.layerModel;
  }
});
