var FormulaOptionModel = require('./formula/formula-option-model');
var FormulaOptionsView = require('./formula/formula-options-view');
var CategoryOptionModel = require('./category/category-option-model');
var CategoryOptionsView = require('./category/category-options-view');

// Order is the same in how things will be presented in the UI
module.exports = [
  {
    type: 'category',
    createOptionModels: function (tuples) {
      return new CategoryOptionModel({
        tuples: tuples,
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
    type: 'formula',
    createOptionModels: function (tuples) {
      var columnModel = tuples[0].columnModel;
      if (columnModel.get('type') === 'number') {
        return new FormulaOptionModel({
          tuples: tuples,
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
  }
];
