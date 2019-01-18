var _ = require('underscore');

var BLACKLISTED_COLUMNS = ['created_at', 'the_geom', 'the_geom_webmercator', 'updated_at'];

module.exports = function (nodeDefModel, layerDefinitionModel) {
  var tuplesItems = {};

  if (!layerDefinitionModel) return tuplesItems; // e.g. if the node is one of those temporary tables

  var querySchemaModel = nodeDefModel.querySchemaModel;
  if (!querySchemaModel) return tuplesItems;

  querySchemaModel.columnsCollection.each(function (m) {
    var columnName = m.get('name');

    if (!_.contains(BLACKLISTED_COLUMNS, columnName)) {
      var key = columnName + '-' + m.get('type');
      var tuples = tuplesItems[key] = tuplesItems[key] || [];
      tuples.push({
        analysisDefinitionNodeModel: nodeDefModel,
        layerDefinitionModel: layerDefinitionModel,
        columnModel: m
      });
    }
  });

  return tuplesItems;
};
