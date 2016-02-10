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
    // TODO change to table_name once https://github.com/CartoDB/cartodb/issues/6553 is fixed
    //   for now can use layer_name, while it's not customized
    if (o.layer_name) {
      return this._tablesCollection.get(o.layer_name);
    }
  }
});
