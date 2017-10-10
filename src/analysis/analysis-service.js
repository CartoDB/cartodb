var _ = require('underscore');
var Analysis = require('./analysis-model');
var camshaftReference = require('./camshaft-reference');
var LayerTypes = require('../geo/map/layer-types.js');

var AnalysisService = function (opts) {
  opts = opts || {};
  if (!opts.vis) {
    throw new Error('vis option is required');
  }
  if (!opts.layersCollection) {
    throw new Error('layersCollection option is required');
  }
  if (!opts.dataviewsCollection) {
    throw new Error('dataviewsCollection option is required');
  }

  this._vis = opts.vis;
  this._apiKey = opts.apiKey;
  this._authToken = opts.authToken;
  this._camshaftReference = opts.camshaftReference || camshaftReference; // For testing purposes
  this._layersCollection = opts.layersCollection;
  this._dataviewsCollection = opts.dataviewsCollection;
};

/**
 * Create an analysis node
 *
 * Recursively generates a graph of analyses and returns the "origin" node. Each node
 * may have one or more "source" params pointing to another node. If a node had been created
 * already, this method updates the attributes of the existing node. New nodes are added to
 * the collection of analyses that has been injected.
 */
AnalysisService.prototype.createAnalysis = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysisAttrs = this._createAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

  if (this._apiKey) {
    analysisAttrs.apiKey = this._apiKey;
  }
  if (this._authToken) {
    analysisAttrs.authToken = this._authToken;
  }

  // TODO: check id to avoid duplicated analysis nodes

  var analysis = new Analysis(analysisAttrs, {
    camshaftReference: this._camshaftReference,
    vis: this._vis
  });

  return analysis;
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
  }.bind(this));

  return _.omit(_.extend(analysisDefinition, analysisDefinition.params, sourceNodes), 'params');
};

/**
 * Create a source analysis
 */
AnalysisService.prototype.createSourceAnalysisForLayer = function (layerId, layerQuery) {
  return this.createAnalysis({
    id: layerId,
    type: 'source',
    params: {
      query: layerQuery
    }
  });
};

/**
 * Update an analysis node
 */
AnalysisService.prototype.updateAnalysis = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysis = this.findNodeById(analysisDefinition.id);

  if (analysis) {
    var analysisAttrs = this._createAnalysisAttributesFromAnalysisDefinition(analysisDefinition);
    analysis.set(analysisAttrs);
  }

  return analysis;
};

/**
 * [description]
 */
AnalysisService.prototype.analyse = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysisAttrs = this._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

  var analysis = this.findNodeById(analysisDefinition.id);

  if (analysis) {
    analysis.set(analysisAttrs);
  } else {
    if (this._apiKey) {
      analysisAttrs.apiKey = this._apiKey;
    }
    if (this._authToken) {
      analysisAttrs.authToken = this._authToken;
    }

    // TODO: check id to avoid duplicated analysis nodes

    analysis = new Analysis(analysisAttrs, {
      camshaftReference: this._camshaftReference,
      vis: this._vis
    });
  }

  return analysis;
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
  }.bind(this));

  return _.omit(_.extend(analysisDefinition, analysisDefinition.params, sourceNodes), 'params');
};

/**
 * Return the analysis node with the provided id
 */
AnalysisService.prototype.findNodeById = function (id) {
  var analyses = AnalysisService.getUniqueAnalysesNodes(this._layersCollection, this._dataviewsCollection);
  return _.find(analyses, function (analysisNode) {
    return analysisNode.get('id') === id;
  });
};

/**
 * Return all the analysis nodes without duplicates.
 * The analyses are obtained from the layers and dataviews collections.
 *
 * @example
 * We have the following analyses:  (a0->a1->a2), (b0->a2)
 * This method will give us: (a0->a1->a2), (a1->a2), (a2), (b0->a2)
 */
AnalysisService.getUniqueAnalysesNodes = function (layersCollection, dataviewsCollection) {
  var uniqueAnalyses = {};
  var analyses = AnalysisService.getAnalysisList(layersCollection, dataviewsCollection);
  _.each(analyses, function (analysis) {
    _.each(analysis.getNodes(), function (analysisNode) {
      uniqueAnalyses[analysisNode.get('id')] = analysisNode;
    });
  });

  return _.map(uniqueAnalyses, function (analisis) { return analisis; }, this);
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
