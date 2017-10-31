var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

function Dataset (id, dataset) {
  this._id = id;
  this._dataset = dataset;
}

Dataset.prototype.$setEngine = function (engine) {
  this._internalModel = new AnalysisModel({
    id: this._id,
    type: 'source',
    query: 'SELECT * from ' + this._dataset
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};

Dataset.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = Dataset;
