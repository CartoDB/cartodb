var _ = require('underscore');
var Backbone = require('backbone');
var Analysis = require('./analysis-model');
var camshaftReference = require('./camshaft-reference');
var LayerTypes = require('../geo/map/layer-types.js');

var AnalysisService = function (opts) {
  opts = opts || {};
  if (!opts.engine) {
    throw new Error('engine is required');
  }

  this._engine = opts.engine;
  this._apiKey = opts.apiKey;
  this._authToken = opts.authToken;
  this._camshaftReference = opts.camshaftReference || camshaftReference; // For testing purposes

  this._analysisNodes = new Backbone.Collection();
};

/**
  * Recursively generates a graph of analyses and returns the "root" node.
  * For each node definition in the analysisDefinition:
  *  - If a node had been already created this method updates the attributes of the existing node.
  *  - Otherwise create a new node and index it by id into the `_analysisNodes` object.
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
      engine: this._engine
    });

    this._analysisNodes.add(analysis);
    analysis.bind('destroy', this._onAnalysisRemoved, this);
  }

  return analysis;
};

/**
 * This function is used to iterate over the analysis graph.
 * It uses the camshaft reference to extract those parameters which are analysis nodes. And call analyse on them.
 *
 * This function wont be needed if we split the analysis definition in `params` and `inputs`. Where all analysis
 * are garanted to be in the inputs object.
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
 * This function is used because some legacy viz.json files contains layers without `source` and have a `query` field instead.
 * This query is translated into a analysis of type `source`.
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

AnalysisService.prototype.findNodeById = function (id) {
  return this._analysisNodes.get(id);
};

AnalysisService.prototype._onAnalysisRemoved = function (analysis) {
  this._analysisNodes.remove(analysis);
  analysis.unbind('destroy', this._onAnalysisRemoved);
};

/**
 * Return all the analysis nodes without duplicates.
 * The analyses are obtained from the layers and dataviews collections.
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
  return _.chain(layers)
    .map(function (layer) {
      return layer.getSource();
    })
    .compact()
    .value();
}

function _getAnalysesFromDataviews (dataviewsCollection) {
  return dataviewsCollection.chain()
    .map(function (dataview) {
      return dataview.getSource();
    })
    .compact()
    .value();
}

function _getCartoDBAndTorqueLayers (layersCollection) {
  return layersCollection.filter(function (layer) {
    // Carto and torque layers are supposed to have a source
    return LayerTypes.isCartoDBLayer(layer) || LayerTypes.isTorqueLayer(layer);
  });
}

module.exports = AnalysisService;
