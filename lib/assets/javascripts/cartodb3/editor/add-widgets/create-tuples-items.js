/**
 * Tmp data structure with column and layer-def models for each unique name+type tuple.
 * Each bucket contains a columnModel and layerDefinitionModel tuple,
 * since they are unique even if the columns' name+type happen to be the same
 * e.g.
 *   {
 *     foobar-string: [{
 *       columnModel: M({name: 'foobar', type: 'string', …}),
 *       layerDefinitionModel: M({ id: 'abc-123', … })
 *     }]
 *   }
 * From this widget definition options for specific needs
 *
 * @param {Object} layerDefinitionsCollection
 * @return {Object} Where
 */
module.exports = function (layerDefinitionsCollection) {
  return layerDefinitionsCollection
    .reduce(function (tuplesItems, layerDefModel) {
      var layerTableModel = layerDefModel.layerTableModel;
      if (layerTableModel) {
        layerTableModel.columnsCollection.each(function (m) {
          var key = m.get('name') + '-' + m.get('type');
          var tuples = tuplesItems[key] = tuplesItems[key] || [];
          tuples.push({
            layerDefinitionModel: layerDefModel,
            columnModel: m
          });
        });
      }
      return tuplesItems;
    }, {});
};
