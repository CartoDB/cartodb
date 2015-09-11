var cdb = require('cartodb.js');

if (typeof module !== 'undefined') {
  module.exports = {};
}

/**
 * Model representing an entity (user, group, etc.) that may share a Visualization.
 * Actual model is wrapped with additional metadata for the grantable context.
 */
cdb.admin.Grantable = cdb.core.Model.extend({

  // @return {Object} instance of the real model this grantable entitity represents
  //   Keep in mind that this returns a new instance of that model (i.e. not a cache version)
  realModel: function() {
    return new cdb.admin[this._modelName()](this.get('model'));
  },

  _modelName: function() {
    return cdb.Utils.capitalize(this.get('type'));
  }

});
