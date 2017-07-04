var _ = require('underscore');
var Model = require('../core/model');
var CategoryFilter = require('../windshaft/filters/category');
var RangeFilter = require('../windshaft/filters/range');
var CategoryDataviewModel = require('./category-dataview-model');
var FormulaDataviewModel = require('./formula-dataview-model');
var HistogramDataviewModel = require('./histogram-dataview-model');
var ListDataviewModel = require('./list-dataview-model');

/**
 * Factory to create dataviews.
 * Takes care of adding and wiring up lifeceycle to other related objects (e.g. dataviews collection, layers etc.)
 */
module.exports = Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.map) throw new Error('map is required');
    if (!opts.vis) throw new Error('vis is required');
    if (!opts.analysisCollection) throw new Error('analysisCollection is required');
    if (!opts.dataviewsCollection) throw new Error('dataviewsCollection is required');
    if (!opts.analysisCollection) throw new Error('analysisCollection is required');

    this._map = opts.map;
    this._vis = opts.vis;
    this._analysisCollection = opts.analysisCollection;
    this._dataviewsCollection = opts.dataviewsCollection;
    this._analysisCollection = opts.analysisCollection;
  },

  createCategoryModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['column']);
    attrs = this._generateAttrsForDataview(layerModel, attrs, CategoryDataviewModel.ATTRS_NAMES);
    attrs.aggregation = attrs.aggregation || 'count';
    attrs.aggregation_column = attrs.aggregation_column || attrs.column;

    var categoryFilter = new CategoryFilter({
      layer: layerModel
    });

    return this._newModel(
      new CategoryDataviewModel(attrs, {
        map: this._map,
        vis: this._vis,
        layer: layerModel,
        filter: categoryFilter,
        analysisCollection: this._analysisCollection
      })
    );
  },

  createFormulaModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['column', 'operation']);
    attrs = this._generateAttrsForDataview(layerModel, attrs, FormulaDataviewModel.ATTRS_NAMES);
    return this._newModel(
      new FormulaDataviewModel(attrs, {
        map: this._map,
        vis: this._vis,
        layer: layerModel,
        analysisCollection: this._analysisCollection
      })
    );
  },

  createHistogramModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['column']);
    attrs = this._generateAttrsForDataview(layerModel, attrs, HistogramDataviewModel.ATTRS_NAMES);

    var rangeFilter = new RangeFilter({
      layer: layerModel
    });

    return this._newModel(
      new HistogramDataviewModel(attrs, {
        map: this._map,
        vis: this._vis,
        layer: layerModel,
        filter: rangeFilter,
        analysisCollection: this._analysisCollection
      })
    );
  },

  createListModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['columns']);
    attrs = this._generateAttrsForDataview(layerModel, attrs, ListDataviewModel.ATTRS_NAMES);
    return this._newModel(
      new ListDataviewModel(attrs, {
        map: this._map,
        vis: this._vis,
        layer: layerModel,
        analysisCollection: this._analysisCollection
      })
    );
  },

  _generateAttrsForDataview: function (layerModel, attrs, whitelistedAttrs) {
    attrs = _.pick(attrs, whitelistedAttrs);
    attrs.source = attrs.source || { id: layerModel.id };
    if (this.get('apiKey')) {
      attrs.apiKey = this.get('apiKey');
    }
    if (this.get('authToken')) {
      attrs.authToken = this.get('authToken');
    }
    return attrs;
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
