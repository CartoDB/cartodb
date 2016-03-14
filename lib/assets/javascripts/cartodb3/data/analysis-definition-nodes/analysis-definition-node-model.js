var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Base model for a analysis definition.
 *
 * An analysis node can have 0..N source models, but only one can be primary for each node (source_id by default).
 */
module.exports = cdb.core.Model.extend({

  initialize: function () {
    if (!this.id) {
      var sourceId = this.sourceIds()[0];
      this.set('id', this.collection.ids.next(sourceId));
    }
  },

  /**
   * @return {Array} e.g. ['c3', 'b2']
   */
  sourceIds: function () {
    return _.map(this._sourceNames(), function (sourceName) {
      return this.get(sourceName);
    }, this);
  },

  /**
   * @protected
   * @return {Array} e.g. ['source_id']
   */
  _sourceNames: function () {
    return ['source_id'];
  }

});
