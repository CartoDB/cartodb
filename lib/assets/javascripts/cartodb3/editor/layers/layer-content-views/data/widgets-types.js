var _ = require('underscore');
var FormulaOptionModel = require('../../../../components/modals/add-widgets/formula/formula-option-model');
var CategoryOptionModel = require('../../../../components/modals/add-widgets/category/category-option-model');
var HistogramOptionModel = require('../../../../components/modals/add-widgets/histogram/histogram-option-model');
var TimeSeriesOptionModel = require('../../../../components/modals/add-widgets/time-series/time-series-option-model');

var CARTODB_ID = 'cartodb_id';

module.exports = function (tuplesItems) {
  return _.reduce(tuplesItems, function (memo, tuples) {
    var columnModel = tuples[0].columnModel;
    var layerDef = tuples[0].layerDefinitionModel;
    var table = layerDef.getTableName();
    var type = columnModel.get('type');
    var columnName = columnModel.get('name');
    var m;
    var node;
    var geometry = _t('editor.data.stats.geometry-fallback');

    if (columnName === CARTODB_ID) {
      node = layerDef.getAnalysisDefinitionNodeModel();
      if (node && node.queryGeometryModel) {
        geometry = node.queryGeometryModel.get('simple_geom');
      }

      m = new FormulaOptionModel({
        tuples: tuples,
        table: table,
        title: _t('editor.data.stats.number-of', {
          geometry: geometry
        }),
        column: columnModel.get('type'),
        operation: 'count',
        name: columnName
      });
      memo.push(m);
    } else if (type === 'string' || type === 'boolean') {
      m = new CategoryOptionModel({
        tuples: tuples,
        table: table,
        title: columnName,
        name: columnName,
        column: columnModel.get('type'),
        aggregation: 'count' // or sum
      });
      memo.push(m);
    } else if (columnModel.get('type') === 'number') {
      m = new HistogramOptionModel({
        tuples: tuples,
        table: table,
        title: columnName,
        name: columnName,
        column: columnModel.get('type'),
        bins: 10
      });
      memo.push(m);
    } else if (columnModel.get('type') === 'date') {
      m = new TimeSeriesOptionModel({
        tuples: tuples,
        table: table,
        title: columnName,
        name: columnName,
        column: columnModel.get('type'),
        bins: 256
      });
      memo.push(m);
    }
    return memo;
  }, []);
};
