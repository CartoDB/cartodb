var SourceBase = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

function SourceDataset (id, dataset) {
  this._id = id;
  this._dataset = dataset;
}

SourceDataset.prototype = Object.create(SourceBase.prototype);

SourceDataset.prototype.$setEngine = function (engine) {
  if (!this._internalModel) {
    this._internalModel = new AnalysisModel({
      id: this._id,
      type: 'source',
      query: 'SELECT * from ' + this._dataset
    }, {
      camshaftReference: CamshaftReference,
      engine: engine
    });
  }
};

SourceDataset.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = SourceDataset;
