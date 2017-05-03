var _ = require('underscore');
var Analysis = require('./analysis-model');
var camshaftReference = require('./camshaft-reference');

var AnalysisFactory = function (opts) {
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
 */
AnalysisFactory.prototype.analyse = function (analysisDefinition) {
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

AnalysisFactory.prototype._getAnalysisAttributesFromAnalysisDefinition = function (analysisDefinition) {
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

AnalysisFactory.prototype._onAnalysisRemoved = function (analysis) {
  this._removeAnalsyisFromIndex(analysis);
  analysis.unbind('destroy', this._onAnalysisRemoved);
};

AnalysisFactory.prototype.findNodeById = function (id) {
  return this._analysisCollection.get(id);
};

AnalysisFactory.prototype._addAnalysisToCollection = function (analysis) {
  return this._analysisCollection.add(analysis);
};

AnalysisFactory.prototype._removeAnalsyisFromIndex = function (analysis) {
  return this._analysisCollection.remove(analysis);
};

module.exports = AnalysisFactory;
