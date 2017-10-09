var _ = require('underscore');
var Analysis = require('./analysis-model');
var camshaftReference = require('./camshaft-reference');
var LayerTypes = require('../geo/map/layer-types.js');

var AnalysisService = function (opts) {
  opts = opts || {};
  if (!opts.analysisCollection) {
    throw new Error('analysisCollection option is required');
  }
  if (!opts.vis) {
    throw new Error('vis option is required');
  }

  this._camshaftReference = opts.camshaftReference || camshaftReference;
  this._analysisCollection = opts.analysisCollection;
  this._apiKey = opts.apiKey;
  this._authToken = opts.authToken;
  this._vis = opts.vis;
};

/**
 * Recursively generates a graph of analyses and returns the "origin" node. Each node
 * may have one or more "source" params pointing to another node. If a node had been created
 * already, this method updates the attributes of the existing node. New nodes are added to
 * the collection of analyses that has been injected.
 *
 * TODO: document what's the analysis definition
 */
AnalysisService.prototype.analyse = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysis = this._analysisCollection.get(analysisDefinition.id);
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
    this._addAnalysisToCollection(analysis);
    analysis.bind('destroy', this._onAnalysisRemoved, this);
  }
  return analysis;
};

AnalysisService.prototype.createAnalysis = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysisAttrs = this._createAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

  if (this._apiKey) {
    analysisAttrs.apiKey = this._apiKey;
  }
  if (this._authToken) {
    analysisAttrs.authToken = this._authToken;
  }
  var analysis = new Analysis(analysisAttrs, {
    camshaftReference: this._camshaftReference,
    vis: this._vis
  });

  return analysis;
};

AnalysisService.prototype.createSourceAnalysisForLayer = function (layerId, layerQuery) {
  return this.createAnalysis({
    id: layerId,
    type: 'source',
    params: {
      query: layerQuery
    }
  });
};

AnalysisService.prototype._getAnalysisAttributesFromAnalysisDefinition = function (analysisDefinition) {
  var analysisType = analysisDefinition.type;
  var sourceNamesForAnalysisType = this._camshaftReference.getSourceNamesForAnalysisType(analysisType);
  var sourceNodes = {};
  _.each(sourceNamesForAnalysisType, function (sourceName) {
    var sourceParams = analysisDefinition.params[sourceName];
    if (sourceParams) {
      sourceNodes[sourceName] = this.analyse(sourceParams);
    }
  }, this);

  return _.omit(_.extend(analysisDefinition, analysisDefinition.params, sourceNodes), 'params');
};

AnalysisService.prototype._createAnalysisAttributesFromAnalysisDefinition = function (analysisDefinition) {
  var analysisType = analysisDefinition.type;
  var sourceNamesForAnalysisType = this._camshaftReference.getSourceNamesForAnalysisType(analysisType);
  var sourceNodes = {};
  _.each(sourceNamesForAnalysisType, function (sourceName) {
    var sourceParams = analysisDefinition.params[sourceName];
    if (sourceParams) {
      sourceNodes[sourceName] = this.createAnalysis(sourceParams);
    }
  }, this);

  return _.omit(_.extend(analysisDefinition, analysisDefinition.params, sourceNodes), 'params');
};

AnalysisService.prototype._onAnalysisRemoved = function (analysis) {
  this._removeAnalsyisFromIndex(analysis);
  analysis.unbind('destroy', this._onAnalysisRemoved);
};

AnalysisService.prototype._addAnalysisToCollection = function (analysis) {
  return this._analysisCollection.add(analysis);
};

AnalysisService.prototype._removeAnalsyisFromIndex = function (analysis) {
  return this._analysisCollection.remove(analysis);
};

/**
 * Return the analysis node with the provided id
 */
AnalysisService.findNodeById = function (id, layersCollection, dataviewsCollection) {
  var analyses = AnalysisService.getUniqueAnalysesNodes(layersCollection, dataviewsCollection);
  return _.find(analyses, function (analysisNode) {
    return analysisNode.get('id') === id;
  });
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

/**
 * Return all the analysis nodes without duplicates.
 * The analyses are obtained from the layers and dataviews collections.
 *
 * @example
 * We have the following analyses:  (a0->a1->a2), (b0->a2)
 * This method will give us: (a0->a1->a1), (a1->a2), (a2), (b0->a2)
 */
AnalysisService.getUniqueAnalysesNodes = function (layersCollection, dataviewsCollection) {
  var uniqueAnalyses = {};
  var analyses = AnalysisService.getAnalysisList(layersCollection, dataviewsCollection);
  _.each(analyses, function (analysis) {
    _.each(analysis.getNodes(), function (analysisNode) {
      uniqueAnalyses[analysisNode.get('id')] = analysisNode;
    }, this);
  }, this);

  return _.map(uniqueAnalyses, function (analisis) { return analisis; }, this);
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
