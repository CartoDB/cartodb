var _ = require('underscore');
var Analysis = require('./analysis-model');
var Model = require('../core/model');

module.exports = Model.extend({

  initialize: function (attrs, opts) {
    this._analysisMap = {};
  },

  analyse: function (analysisDefinition) {
    analysisDefinition = _.clone(analysisDefinition);

debugger;
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
    var params;
    if (analysisDefinition.type === 'source') {
      attributes = analysisDefinition;
    } else if (['trade-area', 'estimated-population', 'union'].indexOf(analysisDefinition.type) >= 0) {
      var sourceAnalysis = this.analyse(analysisDefinition.params.source);
      params = _.extend(analysisDefinition.params, {
        source: sourceAnalysis
      });
      attributes = _.extend(analysisDefinition, { params: params });
    } else if (analysisDefinition.type === 'point-in-polygon') {
      var pointsSource = this.analyse(analysisDefinition.params.points_source);
      var polygonsSource = this.analyse(analysisDefinition.params.polygons_source);
      debugger;
      params = _.extend(analysisDefinition.params, {
        points_source: pointsSource,
        polygons_source: polygonsSource
      });
      attributes = _.extend(analysisDefinition, { params: params });
    }
    return attributes;
  },

  _onAnalysisRemoved: function (analysis) {
    this._removeAnalsyisFromIndex(analysis);
    analysis.unbind('destroy', this._onAnalysisRemoved);
  },

  findNodeById: function (analysisId) {
    return this._getAnalysisFromIndex(analysisId);
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
