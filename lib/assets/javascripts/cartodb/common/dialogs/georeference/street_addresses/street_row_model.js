var RowModel = require('../row_model');
var StreetRowView = require('./street_row_view');

/**
 * Specialization for the street row, to add an additonal row
 */
module.exports = RowModel.extend({

  createView: function() {
    return new StreetRowView({
      model: this
    });
  },

  addRow: function() {
    var newRowModel = new this.constructor({
      label: 'Additional information to complete street address',
      data: this.get('data')
    });
    this.collection.add(newRowModel, { at: this._indexAfterThisModel() });
  },

  _indexAfterThisModel: function() {
    return this.collection.indexOf(this) + 1;
  }

});
