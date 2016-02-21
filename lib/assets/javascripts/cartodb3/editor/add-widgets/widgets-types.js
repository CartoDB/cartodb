var FormulaOptionModel = require('./formula/formula-option-model');
var FormulaOptionsView = require('./formula/formula-options-view');

module.exports = [
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
    tabPaneItem: function (optionsCollection) {
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
