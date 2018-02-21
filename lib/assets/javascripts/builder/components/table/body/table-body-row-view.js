var CoreView = require('backbone/core-view');
var _ = require('underscore');
var cellTemplate = require('./table-body-cell.tpl');
var pointGeojsonParser = require('builder/helpers/point-geojson-parser');

var FORMATTED_TYPE_VALUES = {
  'geometry': pointGeojsonParser
};

var EXCLUDED_COLUMNS = ['the_geom_webmercator'];

/*
 *  Table body row view
 */

module.exports = CoreView.extend({

  className: 'Table-row',
  tagName: 'tr',

  options: {
    simpleGeometry: ''
  },

  initialize: function (opts) {
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');

    this._columnsCollection = opts.columnsCollection;
    this._tableViewModel = opts.tableViewModel;

    this.el.setAttribute('data-model', this.model.cid);

    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this._generateRowsHTML();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);
  },

  _generateRowsHTML: function () {
    var r = [];

    for (var i = 0, l = this._columnsCollection.size(); i < l; i++) {
      var mdl = this._columnsCollection.at(i);
      var columnName = mdl.get('name');

      if (!_.contains(EXCLUDED_COLUMNS, columnName)) {
        r[i] = this._generateCellHTML(columnName);
      }
    }

    this.el.innerHTML = r.join('');
  },

  _generateCellHTML: function (columnName) {
    var simpleGeometry = this.options.simpleGeometry;
    var columnModel = _.first(this._columnsCollection.where({ name: columnName }));
    var columnType = columnModel.get('type');
    var value = this.model.get(columnName);
    var formattedValue = value;

    if (columnType === 'geometry') {
      if (simpleGeometry === 'point') {
        formattedValue = FORMATTED_TYPE_VALUES[columnType](value);
      } else {
        formattedValue = simpleGeometry && (simpleGeometry.charAt(0).toUpperCase() + simpleGeometry.slice(1));
      }
    } else if (FORMATTED_TYPE_VALUES[columnType]) {
      formattedValue = FORMATTED_TYPE_VALUES[columnType](value);
    }

    return cellTemplate({
      value: value,
      formattedValue: formattedValue,
      type: columnType,
      columnName: columnName,
      geometry: simpleGeometry
    });
  }
});
