/*
 *  Track geometry changes that happens in any Node definition model
 */

module.exports = {
  track: function (params) {
    if (!params) throw new Error('several parameters required');
    if (!params.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!params.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!params.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');

    this._layerDefinitionsCollection = params.layerDefinitionsCollection;
    this._analysisDefinitionsCollection = params.analysisDefinitionsCollection;

    params.analysisDefinitionNodesCollection.bind('change:simple_geom', this._onNodeGeometryChange, this);
  },

  _onNodeGeometryChange: function (nodeDefModel) {
    if (nodeDefModel.get('table_name')) { // If it is a source node, no save
      return;
    }
    var layerDefModel = this._layerDefinitionsCollection.findWhere({ source: nodeDefModel.get('id') });
    if (layerDefModel) {
      this._analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
    }
  }
};
