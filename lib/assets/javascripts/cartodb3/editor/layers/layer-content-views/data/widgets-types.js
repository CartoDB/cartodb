var _ = require('underscore');
var CategoryOptionModel = require('../../../../components/modals/add-widgets/category/category-option-model');
var HistogramOptionModel = require('../../../../components/modals/add-widgets/histogram/histogram-option-model');
var FormulaOptionModel = require('../../../../components/modals/add-widgets/formula/formula-option-model');

// Order is the same in how things will be presented in the UI
module.exports = [
  {
    type: 'category',
    createOptionModels: function (tuplesItems) {
      return _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        var table = tuples[0].layerDefinitionModel.getTableName();
        var type = columnModel.get('type');
        var m;
        if (type === 'string' || type === 'boolean') {
          m = new CategoryOptionModel({
            tuples: tuples,
            table: table,
            title: _t('editor.widgets.widgets-types.category') + ' ' + columnModel.get('name'),
            name: columnModel.get('name'),
            column: columnModel.get('type'),
            aggregation: 'count' // or sum
          });
          memo.push(m);
        }
        return memo;
      }, []);
    }
  },
  {
    type: 'histogram',
    createOptionModels: function (tuplesItems) {
      return _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        var table = tuples[0].layerDefinitionModel.getTableName();
        if (columnModel.get('type') === 'number') {
          var m = new HistogramOptionModel({
            tuples: tuples,
            table: table,
            title: _t('editor.widgets.widgets-types.histogram') + ' ' + columnModel.get('name'),
            name: columnModel.get('name'),
            column: columnModel.get('type'),
            bins: 10
          });
          memo.push(m);
        }
        return memo;
      }, []);
    }
  },
  {
    type: 'formula',
    createOptionModels: function (tuplesItems) {
      return _.reduce(tuplesItems, function (memo, tuples) {
        var columnModel = tuples[0].columnModel;
        var table = tuples[0].layerDefinitionModel.getTableName();
        if (columnModel.get('type') === 'number') {
          var m = new FormulaOptionModel({
            tuples: tuples,
            table: table,
            title: _t('editor.widgets.widgets-types.formula') + ' ' + columnModel.get('name'),
            operation: 'avg',
            name: columnModel.get('name'),
            column: columnModel.get('type')
          });
          memo.push(m);
        }
        return memo;
      }, []);
    }
  }
];
