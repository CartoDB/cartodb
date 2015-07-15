var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = cdb.core.View.extend({

  _MAX_ROWS: 100000,
  _MAX_COLS: 60,
  _EXCLUDED_COLUMNS: [
    'cartodb_id', 'lat', 'lon', 'lng', 'long', 'latitude', 'longitude', 'shape_length',
    'shape_area', 'objectid', 'id', 'country', 'state', 'created_at', 'updated_at',
    'iso2', 'iso3', 'x_coord', 'y_coord', 'xcoord', 'ycoord', 'cartodb_georef_status'
  ],

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new Error('table is required');
    }

    this._initModels();
    this._initViews();
  },

  _check: function() {
    var tableData     = this.options.table.data();
    var geometryTypes = tableData.table && tableData.table.get("stats_geometry_types");
    var hasGeometries = geometryTypes && geometryTypes.length > 0 ? true : false;

    var row_count     = tableData.length;
    var hasRows       = row_count > 0 && row_count < this._MAX_ROWS;

    var col_count = _(this.query_schema).size();
    var hasColumns = col_count > 0 && col_count < this._MAX_COLS;

    if (hasGeometries && hasRows && hasColumns) {
      return true;
    } else {
      return false;
    }
  },

  _initModels: function() {
    this.columns = new Backbone.Collection();
    this.model = new cdb.core.Model({ page: 1, maxPages: 0 });
  },

  _initViews: function() {

    this.table = this.options.table;
    this.query_schema = this.table.data().query_schema;
    this.backgroundPollingModel = this.options.backgroundPollingModel;

    if (this._check() && this.backgroundPollingModel.canAddAnalysis()) {
      this.backgroundPollingModel.removeAnalysis();
      this._setupColumns();
      this._start();
    }
  },

  _getSimplifiedGeometryType: function(g) {
    return {
      st_multipolygon: 'polygon',
      st_polygon: 'polygon',
      st_multilinestring: 'line',
      st_linestring: 'line',
      st_multipoint: 'point',
      st_point: 'point'
    }[g.toLowerCase()];
  },

  _getGeometryType: function() {
    var geometry_types = this.table.data().table.get("stats_geometry_types")
    return this._getSimplifiedGeometryType(geometry_types[0]);
  },

  _start: function() {
    var columns = this.columns.map(function(column) {
      return { table_id: this.table.id, column: column.get("name"), geometry_type: column.get("geometry_type") };
    }, this);

    this.backgroundPollingModel.addAnalysis(columns);
  },

  _setupColumns: function() {

    _(this.query_schema).each(function(type, name) {
      if (!_.include(this._EXCLUDED_COLUMNS, name)) {
        this.columns.add({ name: name.concat(""), geometry_type: this._getGeometryType() });
      }
    }, this);
  }

});
