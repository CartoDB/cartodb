var CategoryOptionModel = require('./category/category-option-model');
var CategoryOptionsView = require('./category/category-options-view');
var HistogramOptionModel = require('./histogram/histogram-option-model');
var HistogramOptionsView = require('./histogram/histogram-options-view');
var FormulaOptionModel = require('./formula/formula-option-model');
var FormulaOptionsView = require('./formula/formula-options-view');
var TimeSeriesOptionModel = require('./time-series/time-series-option-model');
var TimeSeriesOptionsView = require('./time-series/time-series-options-view');

// Order is the same in how things will be presented in the UI
module.exports = [
  {
    type: 'category',
    createOptionModels: function (tuples) {
      var columnModel = tuples[0].columnModel;
      return new CategoryOptionModel({
        tuples: tuples,
        title: 'Category ' + columnModel.get('name'),
        aggregation: 'sum' // or count
      });
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('editor.add-widgets.tab-pane.category-label'),
        createContentView: function () {
          return new CategoryOptionsView({
            collection: optionsCollection
          });
        }
      };
    }
  },
  {
    type: 'histogram',
    createOptionModels: function (tuples) {
      var columnModel = tuples[0].columnModel;
      if (columnModel.get('type') === 'number') {
        return new HistogramOptionModel({
          tuples: tuples,
          title: 'Histogram ' + columnModel.get('name'),
          bins: 10
        });
      }
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('editor.add-widgets.tab-pane.histogram-label'),
        createContentView: function () {
          return new HistogramOptionsView({
            collection: optionsCollection
          });
        }
      };
    }
  },
  {
    type: 'formula',
    createOptionModels: function (tuples) {
      var columnModel = tuples[0].columnModel;
      if (columnModel.get('type') === 'number') {
        return new FormulaOptionModel({
          tuples: tuples,
          title: 'Formula ' + columnModel.get('name'),
          operation: 'avg'
        });
      }
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('editor.add-widgets.tab-pane.formula-label'),
        createContentView: function () {
          return new FormulaOptionsView({
            collection: optionsCollection
          });
        }
      };
    }
  },
  {
    type: 'time-series',
    createOptionModels: function (tuples) {
      var columnModel = tuples[0].columnModel;
      if (columnModel.get('type') === 'date') {
        return new TimeSeriesOptionModel({
          tuples: tuples,
          title: 'Time-series ' + columnModel.get('name'),
          bins: 255,
          start: 0,
          end: Date.now()
        });
      }
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('editor.add-widgets.tab-pane.time-series-label'),
        createContentView: function () {
          return new TimeSeriesOptionsView({
            collection: optionsCollection
          });
        }
      };
    }
  }
];
