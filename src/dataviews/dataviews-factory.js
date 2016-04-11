var _ = require('underscore');
var Model = require('../core/model');
var CategoryFilter = require('../windshaft/filters/category');
var RangeFilter = require('../windshaft/filters/range');
var CategorDataviewModel = require('./category-dataview-model');
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
    if (!opts.windshaftMap) throw new Error('windshaftMap is required');
    if (!opts.dataviewsCollection) throw new Error('dataviewsCollection is required');

    this._map = opts.map;
    this._windshaftMap = opts.windshaftMap;
    this._dataviewsCollection = opts.dataviewsCollection;
  },

  createCategoryModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['column']);
    attrs = _.pick(attrs, CategorDataviewModel.ATTRS_NAMES);
    attrs.aggregation = attrs.aggregation || 'count';
    attrs.aggregation_column = attrs.aggregation_column || attrs.column;
    if (this.get('apiKey')) {
      attrs.apiKey = this.get('apiKey');
    }

    var categoryFilter = new CategoryFilter({
      layer: layerModel
    });

    return this._newModel(
      new CategorDataviewModel(attrs, {
        map: this._map,
        windshaftMap: this._windshaftMap,
        filter: categoryFilter,
        layer: layerModel
      })
    );
  },

  createFormulaModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['column', 'operation']);
    attrs = _.pick(attrs, FormulaDataviewModel.ATTRS_NAMES);
    if (this.get('apiKey')) {
      attrs.apiKey = this.get('apiKey');
    }

    return this._newModel(
      new FormulaDataviewModel(attrs, {
        map: this._map,
        windshaftMap: this._windshaftMap,
        layer: layerModel
      })
    );
  },

  createHistogramModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['column']);
    attrs = _.pick(attrs, HistogramDataviewModel.ATTRS_NAMES);
    if (this.get('apiKey')) {
      attrs.apiKey = this.get('apiKey');
    }

    var rangeFilter = new RangeFilter({
      layer: layerModel
    });

    return this._newModel(
      new HistogramDataviewModel(attrs, {
        map: this._map,
        windshaftMap: this._windshaftMap,
        filter: rangeFilter,
        layer: layerModel
      })
    );
  },

  createListModel: function (layerModel, attrs) {
    _checkProperties(attrs, ['columns']);
    attrs = _.pick(attrs, ListDataviewModel.ATTRS_NAMES);
    if (this.get('apiKey')) {
      attrs.apiKey = this.get('apiKey');
    }

    return this._newModel(
      new ListDataviewModel(attrs, {
        map: this._map,
        windshaftMap: this._windshaftMap,
        layer: layerModel
      })
    );
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
