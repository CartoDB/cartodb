var _ = require('underscore');
var Model = require('../core/model');
var util = require('../core/util');
var CategoryFilter = require('../windshaft/filters/category');
var RangeFilter = require('../windshaft/filters/range');
var CategoryDataviewModel = require('./category-dataview-model');
var FormulaDataviewModel = require('./formula-dataview-model');
var HistogramDataviewModel = require('./histogram-dataview-model');
var BBoxFilter = require('../windshaft/filters/bounding-box');
var MapModelBoundingBoxAdapter = require('../geo/adapters/map-model-bounding-box-adapter');

var REQUIRED_OPTS = [
  'map',
  'engine',
  'dataviewsCollection'
];

/**
 * Factory to create dataviews.
 * Takes care of adding and wiring up lifeceycle to other related objects (e.g. dataviews collection, layers etc.)
 */
module.exports = Model.extend({

  initialize: function (attrs, opts) {
    util.checkRequiredOpts(opts, REQUIRED_OPTS, 'DataviewsFactory');

    this._engine = opts.engine;
    this._dataviewsCollection = opts.dataviewsCollection;

    var mapAdapter = new MapModelBoundingBoxAdapter(opts.map);
    this._bboxFilter = new BBoxFilter(mapAdapter);
  },

  createCategoryModel: function (attrs) {
    _checkProperties(attrs, ['source', 'column']);
    attrs = this._generateAttrsForDataview(attrs, CategoryDataviewModel.ATTRS_NAMES);
    attrs.aggregation = attrs.aggregation || 'count';
    attrs.aggregation_column = attrs.aggregation_column || attrs.column;

    var categoryFilter = new CategoryFilter();

    return this._newModel(
      new CategoryDataviewModel(attrs, {
        engine: this._engine,
        filter: categoryFilter,
        bboxFilter: this._bboxFilter
      })
    );
  },

  createFormulaModel: function (attrs) {
    _checkProperties(attrs, ['source', 'column', 'operation']);
    attrs = this._generateAttrsForDataview(attrs, FormulaDataviewModel.ATTRS_NAMES);
    var dataview = this._newModel(
      new FormulaDataviewModel(attrs, {
        engine: this._engine,
        bboxFilter: this._bboxFilter
      })
    );

    return dataview;
  },

  createHistogramModel: function (attrs) {
    _checkProperties(attrs, ['source', 'column']);
    attrs = this._generateAttrsForDataview(attrs, HistogramDataviewModel.ATTRS_NAMES);

    var rangeFilter = new RangeFilter();

    return this._newModel(
      new HistogramDataviewModel(attrs, {
        engine: this._engine,
        filter: rangeFilter,
        bboxFilter: this._bboxFilter
      })
    );
  },

  _generateAttrsForDataview: function (attrs, whitelistedAttrs) {
    return _.pick(attrs, whitelistedAttrs);
  },

  _newModel: function (m) {
    this._dataviewsCollection.add(m);
    return m;
  }

});

function _checkProperties (obj, propertiesArray) {
  _.each(propertiesArray, function (prop) {
    if (obj[prop] === undefined) {
      throw new Error(prop + ' is required');
    }
  });
}
