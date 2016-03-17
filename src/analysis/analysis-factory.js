var _ = require('underscore');
var Analysis = require('./analysis-model');
var camshaftReference = require('./camshaft-reference');

var AnalysisFactory = function (opts) {
  opts = opts || {};
  if (!opts.analysisCollection) {
    throw new Error('analysisCollection option is required');
  }
  if (!opts.map) {
    throw new Error('map option is required');
  }

  this._camshaftReference = opts.camshaftReference || camshaftReference;
  this._analysisCollection = opts.analysisCollection;
  this._map = opts.map;
};

/**
 * Recursively generates a graph of analyses and returns the "origin" node. Each node
 * may have one or more "source" params pointing to another node. If a node had been created
 * already, this method updates the attributes of the existing node. New nodes are added to
 * the collection of analyses that has been injected.
 */
AnalysisFactory.prototype.analyse = function (analysisDefinition) {
  analysisDefinition = _.clone(analysisDefinition);
  var analysis = this._getAnalysisFromIndex(analysisDefinition.id);
  var analysisAttrs = this._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

  if (analysis) {
    analysis.set(analysisAttrs);
  } else {
    analysis = new Analysis(analysisAttrs, {
      camshaftReference: this._camshaftReference,
      map: this._map
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
    sourceNodes[sourceName] = this.analyse(analysisDefinition.params[sourceName]);
  }, this);
  return _.extend(analysisDefinition, {
    params: _.extend(analysisDefinition.params, sourceNodes)
  });
};

AnalysisFactory.prototype._onAnalysisRemoved = function (analysis) {
  this._removeAnalsyisFromIndex(analysis);
  analysis.unbind('destroy', this._onAnalysisRemoved);
};

AnalysisFactory.prototype.findNodeById = function (analysisId) {
  return this._getAnalysisFromIndex(analysisId);
};

AnalysisFactory.prototype._getAnalysisFromIndex = function (analysisId) {
  return this._analysisCollection.findWhere({ id: analysisId });
};

AnalysisFactory.prototype._addAnalysisToCollection = function (analysis) {
  return this._analysisCollection.add(analysis);
};

AnalysisFactory.prototype._removeAnalsyisFromIndex = function (analysis) {
  return this._analysisCollection.remove(analysis);
};

module.exports = AnalysisFactory;
