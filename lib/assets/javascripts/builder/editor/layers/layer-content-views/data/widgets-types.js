var _ = require('underscore');
var FormulaOptionModel = require('builder/components/modals/add-widgets/formula/formula-option-model');
var CategoryOptionModel = require('builder/components/modals/add-widgets/category/category-option-model');
var HistogramOptionModel = require('builder/components/modals/add-widgets/histogram/histogram-option-model');
var TimeSeriesOptionModel = require('builder/components/modals/add-widgets/time-series/time-series-option-model');

var CARTODB_ID = 'cartodb_id';

module.exports = function (tuplesItems) {
  return _.reduce(tuplesItems, function (memo, tuples) {
    var columnModel = tuples[0].columnModel;
    var layerDef = tuples[0].layerDefinitionModel;
    var table = layerDef.getTableName();
    var type = columnModel.get('type');
    var columnName = columnModel.get('name');
    var model;

    if (columnName === CARTODB_ID) {
      model = new FormulaOptionModel({
        tuples: tuples,
        table: table,
        title: _t('editor.data.stats.feature-count'),
        column: columnModel.get('type'),
        operation: 'count',
        name: columnName
      });
      memo.push(model);
    } else if (type === 'string' || type === 'boolean') {
      model = new CategoryOptionModel({
        tuples: tuples,
        table: table,
        title: columnName,
        name: columnName,
        column: columnModel.get('type'),
        aggregation: 'count' // or sum
      });
      memo.push(model);
    } else if (columnModel.get('type') === 'number') {
      model = new HistogramOptionModel({
        tuples: tuples,
        table: table,
        title: columnName,
        name: columnName,
        column: columnModel.get('type'),
        bins: 10
      });
      memo.push(model);
    } else if (columnModel.get('type') === 'date') {
      model = new TimeSeriesOptionModel({
        tuples: tuples,
        table: table,
        title: columnName,
        name: columnName,
        column: columnModel.get('type')
      });
      memo.push(model);
    }
    return memo;
  }, []);
};
