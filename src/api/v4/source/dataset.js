var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * @param {string} [id] - A unique ID for this source
 * @param {string} dataset The name of an existing dataset
 * 
 * @example
 *
 * // no options
 * new carto.source.Dataset(european_cities');
 * 
 * @example
 *
 * // with options
 * new carto.source.Dataset('european_cities', { id: 'european_cities' });
 * 
 * @constructor
 * @api
 * @memberof carto.source
 *
 */
function Dataset (dataset, options) {
  options = options || {};
  this.id = options.id || Dataset.$generateId();
  this._dataset = dataset;
}

Dataset.prototype.$setEngine = function (engine) {
  this._internalModel = new AnalysisModel({
    id: this.id,
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

Dataset.$nextId = 0;
Dataset.$generateId = function () {
  return 'D' + ++Dataset.$nextId;
};

module.exports = Dataset;
