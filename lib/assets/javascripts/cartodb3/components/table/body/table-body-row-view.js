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

    this._querySchemaModel = opts.querySchemaModel;
    this._columnsCollection = this._querySchemaModel.columnsCollection;

    this.el.setAttribute('data-model', this.model.cid);

    this._initBinds();
  },

  render: function () {
    this._generateRowsHTML();
    return this;
  },

  _initBinds: function () {
    this.model.bind('remove', this.remove, this);
  },

  _generateRowsHTML: function () {
    var html = '';

    this._columnsCollection.each(function (mdl) {
      var columnName = mdl.get('name');
      if (!(this._isCustomQueryApplied() && columnName === 'the_geom_webmercator')) {
        html += this._generateCellHTML(columnName);
      }
    }, this);

    this.el.innerHTML = html;
  },

  _isCustomQueryApplied: function () {
    return this._querySchemaModel.get('query');
  },

  _generateCellHTML: function (columnName) {
    var geom = this._querySchemaModel.getGeometry();
    var simpleGeometry = geom.getSimpleType();
    var columnModel = _.first(this._columnsCollection.where({ name: columnName }));
    var columnType = columnModel.get('type');
    var value = this.model.get(columnName);

    return cellTemplate({
      value: value,
      type: columnType,
      geometry: simpleGeometry
    });
  }
});
