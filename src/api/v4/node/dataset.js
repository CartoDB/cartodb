var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

module.exports = function (id, dataset, engine) {
  return new AnalysisModel({
    id: id,
    type: 'source',
    query: 'SELECT * from ' + dataset
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};
