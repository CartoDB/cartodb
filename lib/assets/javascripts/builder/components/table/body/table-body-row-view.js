var CoreView = require('backbone/core-view');
var _ = require('underscore');
var cellTemplate = require('./table-body-cell.tpl');
var pointGeojsonParser = require('builder/helpers/point-geojson-parser');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var FORMATTED_TYPE_VALUES = {
  'geometry': pointGeojsonParser
};

var REQUIRED_OPTS = [
  'columnsCollection',
  'tableViewModel',
  'canHideColumns'
];

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
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

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
      var model = this._columnsCollection.at(i);
      var columnName = model.get('name');

      if (!this._tableViewModel.isCustomQueryApplied() && columnName === 'the_geom_webmercator') {
        continue;
      }

      if (this._canHideColumns && columnName === 'center' && model.isGeometryColumn()) {
        continue;
      }

      r[i] = this._generateCellHTML(columnName);
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
