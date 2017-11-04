var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * The dataset object is used to easily get data from a table in the database 
 * and use this data in a Layer or a Dataview.
 * 
 * 
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
  this._id = options.id || Dataset.$generateId();
  this._dataset = dataset;
}

/**
 * Creates a new internal model with the given engine
 * and the attributes initialized in the constructor.
 * 
 * @param {Engine} engine - The engine object to be assigned to the internalModel.
 */
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

Dataset.$nextId = 0;
Dataset.$generateId = function () {
  return 'D' + ++Dataset.$nextId;
};

module.exports = Dataset;
