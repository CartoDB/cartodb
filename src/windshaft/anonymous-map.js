var _ = require('underscore');
var MapBase = require('./map-base');
var LayerTypes = require('../geo/map/layer-types.js');

var DEFAULT_CARTOCSS_VERSION = '2.1.0';

var HTTP_LAYER_TYPE = 'http';
var PLAIN_LAYER_TYPE = 'plain';
var MAPNIK_LAYER_TYPE = 'mapnik';
var TORQUE_LAYER_TYPE = 'torque';

var optionsForHTTPLayer = function (layerModel) {
  return {
    id: layerModel.get('id'),
    type: HTTP_LAYER_TYPE,
    options: {
      urlTemplate: layerModel.get('urlTemplate'),
      subdomains: layerModel.get('subdomains'),
      tms: layerModel.get('tms')
    }
  };
};

var optionsForWMSLayer = function (layerModel) {
  return {
    id: layerModel.get('id'),
    type: HTTP_LAYER_TYPE,
    options: {
      urlTemplate: layerModel.get('urlTemplate'),
      tms: true
    }
  };
};

var optionsForPlainLayer = function (layerModel) {
  return {
    id: layerModel.get('id'),
    type: PLAIN_LAYER_TYPE,
    options: {
      color: layerModel.get('color'),
      imageUrl: layerModel.get('image')
    }
  };
};

var optionsForMapnikLayer = function (layerModel) {
  var options = sharedOptionsForMapnikAndTorqueLayers(layerModel);
  options.interactivity = layerModel.getInteractiveColumnNames();

  if (layerModel.infowindow && layerModel.infowindow.hasFields()) {
    options.attributes = {
      id: 'cartodb_id',
      columns: layerModel.infowindow.getFieldNames()
    };
  }

  return {
    id: layerModel.get('id'),
    type: MAPNIK_LAYER_TYPE,
    options: options
  };
};

var optionsForTorqueLayer = function (layerModel) {
  var options = sharedOptionsForMapnikAndTorqueLayers(layerModel);
  return {
    id: layerModel.get('id'),
    type: TORQUE_LAYER_TYPE,
    options: options
  };
};

var sharedOptionsForMapnikAndTorqueLayers = function (layerModel) {
  var options = {
    cartocss: layerModel.get('cartocss'),
    cartocss_version: layerModel.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION
  };

  var layerSourceId = layerModel.get('source');
  if (layerSourceId) {
    options.source = { id: layerSourceId };
  } else if (layerModel.get('sql')) { // Layer has some SQL that needs to be converted into a "source" analysis
    options.sql = layerModel.get('sql');
  }

  if (layerModel.get('sql_wrap')) {
    options.sql_wrap = layerModel.get('sql_wrap');
  }

  return options;
};

var AnonymousMap = MapBase.extend({
  toJSON: function () {
    return {
      buffersize: {mvt: 0},
      layers: this._calculateLayersSection(),
      dataviews: this._calculateDataviewsSection(),
      analyses: this._calculateAnalysesSection()
    };
  },

  _calculateLayersSection: function () {
    return this._layersCollection.chain()
      .map(this._calculateLayerJSON, this)
      .compact()
      .value();
  },

  _calculateLayerJSON: function (layerModel) {
    if (LayerTypes.isTiledLayer(layerModel)) {
      return optionsForHTTPLayer(layerModel);
    } else if (LayerTypes.isPlainLayer(layerModel)) {
      return optionsForPlainLayer(layerModel);
    } else if (LayerTypes.isWMSLayer(layerModel)) {
      return optionsForWMSLayer(layerModel);
    } else if (LayerTypes.isCartoDBLayer(layerModel)) {
      return optionsForMapnikLayer(layerModel);
    } else if (LayerTypes.isTorqueLayer(layerModel)) {
      return optionsForTorqueLayer(layerModel);
    }
  },

  _calculateDataviewsSection: function () {
    return this._dataviewsCollection.reduce(function (dataviews, dataviewModel) {
      dataviews[dataviewModel.get('id')] = dataviewModel.toJSON();
      return dataviews;
    }, {});
  },

  _calculateAnalysesSection: function () {
    var analyses = [];
    var sourceIdsFromLayers = _.chain(this._getCartoDBAndTorqueLayers())
      .map(function (layerModel) {
        return layerModel.get('source');
      })
      .compact()
      .value();

    var sourceIdsFromDataviews = this._dataviewsCollection.chain()
      .map(function (dataviewModel) {
        return dataviewModel.getSourceId();
      })
      .compact()
      .value();

    var sourceIds = _.uniq(sourceIdsFromLayers.concat(sourceIdsFromDataviews));
    _.each(sourceIds, function (sourceId) {
      var sourceAnalysis = this._analysisCollection.findWhere({ id: sourceId });
      if (sourceAnalysis) {
        if (!this._isAnalysisPartOfOtherAnalyses(sourceAnalysis)) {
          analyses.push(sourceAnalysis.toJSON());
        }
      } else { // sourceId might be the ID of a layer
        var layerModel = this._getLayerById(sourceId);
        if (layerModel) {
          if (layerModel.get('sql')) {
            analyses.push(this._getSourceAnalysisForLayer(this._getLayerById(sourceId)));
          } else {
            // layerModel has a source, so the analysis will be included
            // in the payload when we get to that sourceId in this loop
          }
        } else {
          throw new Error("sourceId '" + sourceId + "' doesn't exist");
        }
      }
    }, this);

    return analyses;
  },

  _getLayerById: function (layerId) {
    return _.find(this._getCartoDBAndTorqueLayers(), function (layerModel) {
      return layerModel.id === layerId;
    });
  },

  _getSourceAnalysisForLayer: function (layerModel) {
    return {
      id: layerModel.id,
      type: 'source',
      params: {
        query: layerModel.get('sql')
      }
    };
  },

  _isAnalysisPartOfOtherAnalyses: function (analysisModel) {
    return this._analysisCollection.any(function (otherAnalysisModel) {
      if (analysisModel !== otherAnalysisModel) {
        return otherAnalysisModel.findAnalysisById(analysisModel.get('id'));
      }
      return false;
    });
  },

  _isAnyDataviewLinkedTo: function (layerModel) {
    return this._dataviewsCollection.any(function (dataviewModel) {
      return dataviewModel.layer === layerModel;
    });
  },

  _getCartoDBAndTorqueLayers: function () {
    return this._layersCollection.select(function (layer) {
      return LayerTypes.isCartoDBLayer(layer) ||
        LayerTypes.isTorqueLayer(layer);
    });
  }
});

module.exports = AnonymousMap;
