var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * @param {string} dataset The name of an existing dataset
 *
 * @example
 *
 * new carto.source.Dataset('european_cities');
 *
 * @constructor
 * @extends carto.source.Base
 * @memberof carto.source
 * @api
 *
 */
function Dataset (dataset) {
  this._id = 'fakeId';
  this._dataset = dataset;
}

Dataset.prototype = Object.create(Base.prototype);

Dataset.prototype.$setEngine = function (engine) {
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

Dataset.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = Dataset;
