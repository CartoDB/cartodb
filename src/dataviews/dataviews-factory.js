var Model = require('../core/model');
// var DataviewsCollection = require('./dataviews-collection');
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
    if (!opts.dataviewsCollection) throw new Error('dataviewsCollection is required');
    if (!opts.interactiveLayersCollection) throw new Error('interactiveLayersCollection is required');

    this._dataviewsCollection = opts.dataviewsCollection;
    this._interactiveLayersCollection = opts.interactiveLayersCollection;
  },

  createCategoryDataview: function (layerModel, attrs) {
    var categoryFilter = new CategoryFilter({
      // TODO Setting layer-index on filters here is not good, if order change the filters won't work on the expected layer anymore!
      layerIndex: this._indexOf(layerModel)
    });
    return this._newModel(
      new CategorDataviewModel(attrs, {
        filter: categoryFilter,
        layer: layerModel
      })
    );
  },

  createFormulaDataview: function (layerModel, attrs) {
    return this._newModel(
      new FormulaDataviewModel(attrs, {
        layer: layerModel
      })
    );
  },

  createHistogramDataview: function (layerModel, attrs) {
    var rangeFilter = new RangeFilter({
      // TODO Setting layer-index on filters here is not good, if order change the filters won't work on the expected layer anymore!
      layerIndex: this._indexOf(layerModel)
    });
    return this._newModel(
      new HistogramDataviewModel(attrs, {
        filter: rangeFilter,
        layer: layerModel
      })
    );
  },

  createListDataview: function (layerModel, attrs) {
    return this._newModel(
      new ListDataviewModel(attrs, {
        layer: layerModel
      })
    );
  },

  _newModel: function (m) {
    this._dataviewsCollection.add(m);
    return m;
  },

  _indexOf: function (layerModel) {
    var index = this._interactiveLayersCollection.indexOf(layerModel);
    if (index >= 0) {
      return index;
    } else {
      throw new Error('layer must be located in layers collection to work');
    }
  }

});
