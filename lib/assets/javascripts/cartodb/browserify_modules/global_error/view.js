// Extracted from cdb/ui/common/table.js, since the notifications should depend on the changes triggered by
// models/collections, not a view.
module.exports = cdb.core.View.extend({
  initialize: function() {
    this.elder('initialize');
    this.dataModel = this.options.dataModel;
    this.globalError = this.options.globalError;
    this._rows = [];
    this.bind('clean', this._clearRows, this);
    this.model.bind('all', this._addRows, this);
    this._addRows();
  },

  notice: function(text, type, time) {
    this.globalError.showError(text, type, time);
  },

  _isEmptyTable: function() {
    return (this.dataModel.length === 0 && this.dataModel.fetched)
  },

  _addRows: function() {
    if (!this._isEmptyTable()) {
      if (this.dataModel.fetched) {
        var self = this;
        this.dataModel.each(function(row) {
          self._addRow(row);
        });
      }
    }
  },

  _addRow: function(row, collection, options) {
    if (!_.include(this._rows, row)) {
      row.bind('saved', this._rowSynched, this);
      row.bind('errorSaving', this._rowFailed, this);
      row.bind('saving', this._rowSaving, this);
      this._rows.push(row);
    }
  },

  _clearRows: function() {
    while(row = this._rows.pop()) {
      // this is a hack to avoid all the elements are removed one by one
      row.unbind(null, null, this);
    }
    this._rows = [];
  },

  _rowSaving: function() {
    this.notice('Saving your edit', 'load', -1);
  },

  _rowSynched: function() {
    this.notice('Sucessfully saved');
  },

  _rowFailed: function() {
    this.notice('Oops, there has been an error saving your changes.', 'error');
  },
});
