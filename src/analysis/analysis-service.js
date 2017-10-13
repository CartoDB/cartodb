var _ = require('underscore');
var Analysis = require('./analysis-model');
var camshaftReference = require('./camshaft-reference');
var LayerTypes = require('../geo/map/layer-types.js');

var AnalysisService = function (opts) {
  opts = opts || {};
  if (!opts.vis) {
    throw new Error('vis option is required');
  }

  this._vis = opts.vis;
  this._apiKey = opts.apiKey;
  this._authToken = opts.authToken;
  this._camshaftReference = opts.camshaftReference || camshaftReference; // For testing purposes

  this._analysisNodes = {};
};

/**
  * Recursively generates a graph of analyses and returns the "root" node. Each node
  * may have one or more "source" params pointing to another node. If a node had been created
  * already, this method updates the attributes of the existing node. New nodes are added to
  * the collection of analyses that has been injected.
  */
AnalysisService.prototype.analyse = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysis = this.findNodeById(analysisDefinition.id);
  var analysisAttrs = this._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

  if (analysis) {
    analysis.set(analysisAttrs);
  } else {
    if (this._apiKey) {
      analysisAttrs.apiKey = this._apiKey;
    }
    if (this._authToken) {
      analysisAttrs.authToken = this._authToken;
    }
    analysis = new Analysis(analysisAttrs, {
      camshaftReference: this._camshaftReference,
      vis: this._vis
    });

    this._analysisNodes[analysisDefinition.id] = analysis;
    analysis.bind('destroy', this._onAnalysisRemoved, this);
  }

  return analysis;
};

/**
 * This function applies recursively the function analyse to the sourceNodes in the analysisDefinition
 */
AnalysisService.prototype._getAnalysisAttributesFromAnalysisDefinition = function (analysisDefinition) {
  var analysisNodes = {};
  var analysisType = analysisDefinition.type;
  var sourceNamesForAnalysisType = this._camshaftReference.getSourceNamesForAnalysisType(analysisType);
  _.each(sourceNamesForAnalysisType, function (sourceName) {
    var sourceParams = analysisDefinition.params[sourceName];
    if (sourceParams) {
      analysisNodes[sourceName] = this.analyse(sourceParams);
    }
  }, this);

  return _.omit(_.extend(analysisDefinition, analysisDefinition.params, analysisNodes), 'params');
};

/**
 * Create a source analysis
 */
AnalysisService.prototype.createAnalysisForLayer = function (layerId, layerQuery) {
  return this.analyse({
    id: layerId,
    type: 'source',
    params: {
      query: layerQuery
    }
  });
};

/**
 * Return the analysis node with the provided id
 */
AnalysisService.prototype.findNodeById = function (id) {
  var analysis = this._analysisNodes[id];
  return analysis;
};

/**
 * Remove the analysis from the dictionary
 */
AnalysisService.prototype._onAnalysisRemoved = function (analysis) {
  delete this._analysisNodes[analysis.id];
  analysis.unbind('destroy', this._onAnalysisRemoved);
};

/**
 * Return all the analysis nodes without duplicates.
 * The analyses are obtained from the layers and dataviews collections.
 *
 * @example
 * We have the following analyses:  (a0->a1->a2), (b0->a2)
 * This method will give us: (a0->a1->a2), (a1->a2), (a2), (b0->a2)
 */
AnalysisService.getUniqueAnalysisNodes = function (layersCollection, dataviewsCollection) {
  var uniqueAnalysisNodes = {};
  var analysisList = AnalysisService.getAnalysisList(layersCollection, dataviewsCollection);
  _.each(analysisList, function (analysis) {
    analysis.getNodesCollection().each(function (analysisNode) {
      uniqueAnalysisNodes[analysisNode.get('id')] = analysisNode;
    });
  });

  return _.map(uniqueAnalysisNodes, function (analisis) { return analisis; }, this);
};

/**
 * Return a list with all the analyses contained in the given collections.
 *
 * @example
 * We have the following analyses:  (a0->a1->a2), (b0->a2)
 * This method will give us: (a0->a1->a2), (b0->a2)
 */
AnalysisService.getAnalysisList = function (layersCollection, dataviewsCollection) {
  var layerAnalyses = _getAnalysesFromLayers(layersCollection);
  var dataviewsAnalyses = _getAnalysesFromDataviews(dataviewsCollection);
  return layerAnalyses.concat(dataviewsAnalyses);
};

function _getAnalysesFromLayers (layersCollection) {
  var layers = _getCartoDBAndTorqueLayers(layersCollection);
  return layers.map(function (layer) {
    return layer.getSource();
  });
}

function _getAnalysesFromDataviews (dataviewsCollection) {
  return dataviewsCollection.map(function (dataview) {
    return dataview.getSource();
  });
}

function _getCartoDBAndTorqueLayers (layersCollection) {
  return layersCollection.filter(function (layer) {
    // Carto and torque layers are supposed to have a source
    return LayerTypes.isCartoDBLayer(layer) || LayerTypes.isTorqueLayer(layer);
  });
}

module.exports = AnalysisService;
