var Something = {
  sync: function (deps) {
    if (!deps.windshaftMap) {
      throw new Error('windshaftMap is required');
    }
    if (!deps.layerGroupModel) {
      throw new Error('layerGroupModel is required');
    }

    if (!deps.analysisCollection) {
      throw new Error('analysisCollection is required');
    }

    this._windshaftMap = deps.windshaftMap;
    this._layerGroupModel = deps.layerGroupModel;
    this._analysisCollection = deps.analysisCollection;

    this._windshaftMap.unbind(null, null, this);
    this._windshaftMap.bind('instanceCreated', function () {
      this._updateLayerGroupModel();
      this._updateAnalysisModels();
    }, this);
  },

  _updateLayerGroupModel: function () {
    this._layerGroupModel.set({
      baseURL: this._windshaftMap.getBaseURL(),
      urls: this._windshaftMap.getTiles('mapnik')
    });
  },

  _updateAnalysisModels: function () {
    this._analysisCollection.each(function (analysisNode) {
      var analysisMetadata = this._windshaftMap.getAnalysisNodeMetadata(analysisNode.get('id'));
      if (analysisMetadata) {
        analysisNode.set({
          status: analysisMetadata.status,
          query: analysisMetadata.query,
          url: analysisMetadata.url.http
        });
      }
    }, this);
  }
};

module.exports = Something;
