var cdb = require('cartodb.js');

/**
 * Base model for a analysis definition.
 */
module.exports = cdb.core.Model.extend({

  initialize: function () {
    if (!this.id) {
      var sourceId = this.sourceModel().id;
      this.set('id', this.collection.nextId(sourceId));
    }
  },

  sourceModel: function () {
    return this.collection.get(this.get('source_id'));
  }

});
