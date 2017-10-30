var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

module.exports = function (id, query, engine) {
  return new AnalysisModel({
    id: id,
    type: 'source',
    query: query
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};
