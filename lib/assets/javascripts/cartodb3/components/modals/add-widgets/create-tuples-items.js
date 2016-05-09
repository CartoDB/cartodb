var _ = require('underscore');

var BLACKLISTED_COLUMNS = ['created_at', 'the_geom', 'the_geom_webmercator', 'updated_at'];

/**
 * Tmp data structure with column and layer-def models for each unique name+type tuple.
 * Each bucket contains a columnModel and layerDefinitionModel tuple,
 * since they are unique even if the columns' name+type happen to be the same
 * From this widget definition options for specific needs
 *
 * @param {Object} layerDefinitionsCollection
 * @return {Object} e.g.
 *   e.g.
 *     {
 *       foobar-string: [{
 *         columnModel: M({name: 'foobar', type: 'string', …}),
 *         layerDefinitionModel: M({ id: 'abc-123', … })
 *       }]
 *     }
 */
module.exports = function (analysisDefinitionNodesCollection, layerDefinitionsCollection) {
  return analysisDefinitionNodesCollection
    .reduce(function (tuplesItems, analysisDefinitionModel) {
      var querySchemaModel = analysisDefinitionModel.querySchemaModel;

      if (querySchemaModel) {
        querySchemaModel.columnsCollection.each(function (m) {
          var columnName = m.get('name');

          if (!_.contains(BLACKLISTED_COLUMNS, columnName)) {
            var key = columnName + '-' + m.get('type');
            var tuples = tuplesItems[key] = tuplesItems[key] || [];
            var letter = analysisDefinitionModel.getLetter();
            var layerDefinitionModel = layerDefinitionsCollection.find(function (l) { return l.get('letter') === letter; });
            tuples.push({
              analysisDefinitionModel: analysisDefinitionModel,
              layerDefinitionModel: layerDefinitionModel,
              columnModel: m
            });
          }
        });
      }

      return tuplesItems;
    }, {});
};
