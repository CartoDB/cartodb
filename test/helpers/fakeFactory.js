var _ = require('underscore');
var AnalysisModel = require('../../src/analysis/analysis-model');
var camshaftReference = require('../../src/analysis/camshaft-reference');

var createAnalysisModel = function (attrs) {
  if (typeof attrs === 'string') throw new Error('BOOM!');

  if (!_.has(attrs, 'type')) {
    attrs.type = 'source';
  }

  var model = new AnalysisModel(attrs, {
    camshaftReference: camshaftReference,
    vis: {
      reload: function () {}
    }
  });

  return model;
};

module.exports = {
  createAnalysisModel: createAnalysisModel
};
