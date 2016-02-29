var _ = require('underscore');
var CategoryOptionModel = require('./category/category-option-model');
var CategoryOptionsView = require('./category/category-options-view');
var HistogramOptionModel = require('./histogram/histogram-option-model');
var HistogramOptionsView = require('./histogram/histogram-options-view');
var FormulaOptionModel = require('./formula/formula-option-model');
var FormulaOptionsView = require('./formula/formula-options-view');
var TimeSeriesOptionModel = require('./time-series/time-series-option-model');
var TimeSeriesNoneOptionModel = require('./time-series/time-series-none-option-model');
var TimeSeriesOptionsView = require('./time-series/time-series-options-view');

// Order is the same in how things will be presented in the UI
module.exports = [
  {
    type: 'category',
    createOptionModels: function (tuplesItems) {
      return _.map(tuplesItems, function (tuples) {
        var columnModel = tuples[0].columnModel;
        return new CategoryOptionModel({
          tuples: tuples,
          title: 'Category ' + columnModel.get('name'),
          aggregation: 'count' // or sum
        });
      });
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('components.modals.add-widgets.tab-pane.category-label'),
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
    createOptionModels: function (tuplesItems) {
      return _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        if (columnModel.get('type') === 'number') {
          var m = new HistogramOptionModel({
            tuples: tuples,
            title: 'Histogram ' + columnModel.get('name'),
            bins: 10
          });
          memo.push(m);
        }
        return memo;
      }, []);
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('components.modals.add-widgets.tab-pane.histogram-label'),
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
    createOptionModels: function (tuplesItems) {
      return _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        if (columnModel.get('type') === 'number') {
          var m = new FormulaOptionModel({
            tuples: tuples,
            title: 'Formula ' + columnModel.get('name'),
            operation: 'avg'
          });
          memo.push(m);
        }
        return memo;
      }, []);
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('components.modals.add-widgets.tab-pane.formula-label'),
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
    createOptionModels: function (tuplesItems, widgetDefinitionsCollection) {
      var existingDefModel = widgetDefinitionsCollection.find(function (m) {
        return m.get('type') === 'time-series';
      });

      var models = _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        var columnName = columnModel.get('name');
        if (columnModel.get('type') === 'date') {
          var attrs = {
            tuples: tuples,
            title: 'Time-series ' + columnName,
            bins: 256
          };

          // Preselect the correct tuple, if there already exists a widget definition
          if (existingDefModel && existingDefModel.get('column') === columnName) {
            _.find(tuples, function (d, i) {
              if (d.layerDefinitionModel.id === existingDefModel.get('layer_id')) {
                attrs.selected = true;
                attrs.layer_index = i;
                return true;
              }
            });
          }

          var m = new TimeSeriesOptionModel(attrs);
          memo.push(m);
        }

        return memo;
      }, []);

      // Special-case; preprend the none-model since it should appear first
      var noneOptionModel = new TimeSeriesNoneOptionModel();
      return [noneOptionModel].concat(models);
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('components.modals.add-widgets.tab-pane.time-series-label'),
        createContentView: function () {
          return new TimeSeriesOptionsView({
            collection: optionsCollection
          });
        }
      };
    }
  }
];
