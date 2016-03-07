var _ = require('underscore');
var Analysis = require('./analysis-model');
var Model = require('../core/model');

module.exports = Model.extend({

  initialize: function (attrs, opts) {
    // An index of existing analysis. When a new analysis is created it's indexed here by
    // it's id
    this._analysisMap = {};
  },

  analyse: function (analysisDefinition) {
    analysisDefinition = _.clone(analysisDefinition);

    var analysis = this._getAnalysisFromIndex(analysisDefinition.id);
    var analysisAttrs = this._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition);
    if (analysis) {
      analysis.set(analysisAttrs);
    } else {
      analysis = new Analysis(analysisAttrs);
      this._addAnalysisToIndex(analysis);
      analysis.bind('destroy', this._onAnalysisRemoved, this);
    }
    return analysis;
  },

  _getAnalysisAttributesFromAnalysisDefinition: function (analysisDefinition) {
    var attributes;
    if (analysisDefinition.type === 'source') {
      attributes = analysisDefinition;
    } else if (analysisDefinition.params.source) {
      // TODO: Unless there's a convention, we might need to check the type of
      // analyis and do this on a one to one basis. Eg: some analysis might
      // have references to multiple nodes
      var sourceAnalysis = this.analyse(analysisDefinition.params.source);
      var params = _.extend(analysisDefinition.params, {
        source: sourceAnalysis
      });
      attributes = _.extend(analysisDefinition, { params: params });
    }
    return attributes;
  },

  _onAnalysisRemoved: function (analysis) {
    this._removeAnalsyisFromIndex(analysis);
    analysis.unbind('destroy', this._onAnalysisRemoved);
  },

  _getAnalysisFromIndex: function (analysisId) {
    return this._analysisMap[analysisId];
  },

  _addAnalysisToIndex: function (analysis) {
    this._analysisMap[analysis.get('id')] = analysis;
  },

  _removeAnalsyisFromIndex: function (analysis) {
    delete this._analysisMap[analysis.get('id')];
  }
});
