var cdb = require('cartodb.js');

/**
 * Base model for a analysis definition.
 *
 * An analysis node can have 0..N source models, but only one can be primary for each node (source_id by default).
 */
module.exports = cdb.core.Model.extend({

  initialize: function () {
    if (!this.id) {
      var sourceId = this.primarySourceModel().id;
      this.set('id', this.collection.nextId(sourceId));
    }
  },

  /**
   * @protected
   * @return {Object} Backbone model of the primary source of this analysis node
   */
  primarySourceModel: function () {
    return this._sourceModel('source_id');
  },

  /**
   * @protected
   * @param {String} sourceIdAttrName
   * @return {Object} a Backbone model, or undefined if there is no matching for the given source id attr name.
   */
  _sourceModel: function (sourceIdAttrName) {
    var sourceId = this.get(sourceIdAttrName);
    return this.collection.get(sourceId);
  }

});
