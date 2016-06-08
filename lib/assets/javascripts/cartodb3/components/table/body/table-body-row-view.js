var CoreView = require('backbone/core-view');
var _ = require('underscore');
var cellTemplate = require('./table-body-cell.tpl');

/*
 *  Table body row view
 */

module.exports = CoreView.extend({

  className: 'Table-row',
  tagName: 'tr',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._columnsCollection = opts.columnsCollection;
    this._tableViewModel = opts.tableViewModel;

    this.el.setAttribute('data-model', this.model.cid);

    this._initBinds();
  },

  render: function () {
    this._generateRowsHTML();
    return this;
  },

  _initBinds: function () {
    // this.model.bind('remove', this.remove, this);
  },

  _generateRowsHTML: function () {
    var html = '';

    this._columnsCollection.each(function (mdl) {
      var columnName = mdl.get('name');

      if (!this._tableViewModel.isDisabled() && columnName === 'the_geom_webmercator') {
        html += '';
      } else {
        html += this._generateCellHTML(columnName);
      }
    }, this);

    this.el.innerHTML = html;
  },

  _generateCellHTML: function (columnName) {
    var geom = this._querySchemaModel.getGeometry();
    var simpleGeometry = geom && geom.getSimpleType();
    var columnModel = _.first(this._columnsCollection.where({ name: columnName }));
    var columnType = columnModel.get('type');
    var value = this.model.get(columnName);

    return cellTemplate({
      value: value,
      type: columnType,
      columnName: columnName,
      geometry: simpleGeometry && (simpleGeometry.charAt(0).toUpperCase() + simpleGeometry.slice(1))
    });
  }
});
