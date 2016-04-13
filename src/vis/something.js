var _ = require('underscore');

var Something = {
  sync: function (deps) {
    if (!deps.windshaftMap) {
      throw new Error('windshaftMap is required');
    }
    if (!deps.layerGroupModel) {
      throw new Error('layerGroupModel is required');
    }
    if (!deps.layersCollection) {
      throw new Error('layersCollection is required');
    }
    if (!deps.dataviewsCollection) {
      throw new Error('dataviewsCollection is required');
    }
    if (!deps.analysisCollection) {
      throw new Error('analysisCollection is required');
    }

    this._windshaftMap = deps.windshaftMap;
    this._layerGroupModel = deps.layerGroupModel;
    this._layersCollection = deps.layersCollection;
    this._dataviewsCollection = deps.dataviewsCollection;
    this._analysisCollection = deps.analysisCollection;

    this._windshaftMap.unbind(null, null, this);
    this._windshaftMap.bind('instanceCreated', function (windshaftMapInstance, sourceLayerId, forceFetch) {
      this._updateLayerGroupModel();
      this._updateLayerModels();
      this._udpateDataviewModels(windshaftMapInstance, sourceLayerId, forceFetch);
      this._updateAnalysisModels();
    }, this);
  },

  _updateLayerGroupModel: function () {
    this._layerGroupModel.set({
      baseURL: this._windshaftMap.getBaseURL(),
      urls: this._windshaftMap.getTiles('mapnik')
    });
  },

  _updateLayerModels: function () {
    var LAYER_TYPES = [ 'CartoDB', 'torque' ];
    _.each(this._layersCollection.select(function (layerModel) {
      return LAYER_TYPES.indexOf(layerModel.get('type')) >= 0;
    }), function (layerModel, layerIndex) {
      layerModel.set('meta', this._windshaftMap.getLayerMetadata(layerIndex));
      if (layerModel.get('type') === 'torque') {
        layerModel.set('urls', this._windshaftMap.getTiles('torque'));
      }
    }, this);
  },

  _udpateDataviewModels: function (windshaftMapInstance, sourceLayerId, forceFetch) {
    this._dataviewsCollection.each(function (dataviewModel) {
      var dataviewMetadata = this._windshaftMap.getDataviewMetadata(dataviewModel.get('id'));
      if (dataviewMetadata) {
        dataviewModel.set({
          url: dataviewMetadata.url[this._getProtocol()]
        }, {
          sourceLayerId: sourceLayerId,
          forceFetch: forceFetch
        });
      }
    }, this);
  },

  _updateAnalysisModels: function () {
    this._analysisCollection.each(function (analysisNode) {
      var analysisMetadata = this._windshaftMap.getAnalysisNodeMetadata(analysisNode.get('id'));
      if (analysisMetadata) {
        analysisNode.set({
          status: analysisMetadata.status,
          query: analysisMetadata.query,
          url: analysisMetadata.url[this._getProtocol()]
        });
      }
    }, this);
  },

  _getProtocol: function () {
    return window.location.protocol.replace(':', '');
  }
};

module.exports = Something;
