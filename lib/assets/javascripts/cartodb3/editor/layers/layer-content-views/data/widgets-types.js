var _ = require('underscore');
var CategoryOptionModel = require('../../../../components/modals/add-widgets/category/category-option-model');
var HistogramOptionModel = require('../../../../components/modals/add-widgets/histogram/histogram-option-model');

module.exports = function (tuplesItems) {
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
    } else if (columnModel.get('type') === 'number') {
      m = new HistogramOptionModel({
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
};
