var cdb = require('cartodb.js');

/**
 * Model to edit a layer definition
 */
module.exports = cdb.core.Model.extend({
  initialize: function (attrs, opts) {
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');
    this._tablesCollection = opts.tablesCollection;

    this.layerModel = opts.layerModel;
  },

  getTableModel: function () {
    var o = this.get('options');
    if (o.table_name) {
      return this._tablesCollection.get(o.table_name);
    }
  }
});
