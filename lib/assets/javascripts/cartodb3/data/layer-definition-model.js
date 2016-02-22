var cdb = require('cartodb-deep-insights.js');

/**
 * Model to edit a layer definition
 */
module.exports = cdb.core.Model.extend({
  initialize: function (attrs, opts) {
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');
    this._tablesCollection = opts.tablesCollection;

    // Optional; Might not exist yet, e.g. for a new layer definition it should not be created until layer is persisted.
    this.layerModel = opts.layerModel;
  },

  getTableModel: function () {
    var o = this.get('options');
    if (o.table_name) {
      return this._tablesCollection.get(o.table_name);
    }
  }
});
