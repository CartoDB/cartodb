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
var ScrollView = require('builder/components/scroll/scroll-view');

var CARTODB_ID = 'cartodb_id';

// Order is the same in how things will be presented in the UI
module.exports = [
  {
    type: 'category',
    createOptionModels: function (tuplesItems) {
      return _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        var type = columnModel.get('type');
        var m;
        if (type === 'string' || type === 'boolean') {
          m = new CategoryOptionModel({
            tuples: tuples,
            title: columnModel.get('name'),
            name: columnModel.get('name'),
            aggregation: 'count' // or sum
          });
          memo.push(m);
        }
        return memo;
      }, []);
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('components.modals.add-widgets.tab-pane.category-label'),
        name: 'category',
        createContentView: function () {
          return new ScrollView({
            createContentView: function () {
              return new CategoryOptionsView({
                collection: optionsCollection
              });
            }
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
            title: columnModel.get('name'),
            name: columnModel.get('name'),
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
        name: 'histogram',
        createContentView: function () {
          return new ScrollView({
            createContentView: function () {
              return new HistogramOptionsView({
                collection: optionsCollection
              });
            }
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
        var columnName = columnModel.get('name');
        var operation = 'avg';
        var title = columnName;

        if (columnModel.get('type') === 'number') {
          if (columnName === CARTODB_ID) {
            operation = 'count';
            title = _t('editor.data.stats.feature-count');
          }

          var m = new FormulaOptionModel({
            tuples: tuples,
            title: title,
            operation: operation,
            name: columnModel.get('name')
          });
          memo.push(m);
        }
        return memo;
      }, []);
    },
    createTabPaneItem: function (optionsCollection) {
      return {
        label: _t('components.modals.add-widgets.tab-pane.formula-label'),
        name: 'formula',
        createContentView: function () {
          return new ScrollView({
            createContentView: function () {
              return new FormulaOptionsView({
                collection: optionsCollection
              });
            }
          });
        }
      };
    }
  },
  {
    type: 'time-series',
    createOptionModels: function (tuplesItems, widgetDefinitionsCollection) {
      var defaults = {
        bins: 256
      };
      var existingDefModel = widgetDefinitionsCollection.find(function (m) {
        return m.get('type') === 'time-series';
      });

      var models = _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        var columnName = columnModel.get('name');
        var columnType = columnModel.get('type');
        if (columnType === 'date' || columnType === 'number') {
          var attrs = {
            tuples: tuples,
            title: columnName
          };
          if (columnType === 'date') {
            attrs.aggregation = defaults.aggregation;
          } else if (columnType === 'number') {
            attrs.bins = defaults.bins;
          }

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
        name: 'time-series',
        createContentView: function () {
          return new ScrollView({
            createContentView: function () {
              return new TimeSeriesOptionsView({
                collection: optionsCollection
              });
            }
          });
        }
      };
    }
  }
];
