var _ = require('underscore');
var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * A Dataset that can be used as the data source for layers and dataviews.
 * 
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
  _checkDataset(dataset);
  this._dataset = dataset;
  Base.apply(this, arguments);
}

Dataset.prototype = Object.create(Base.prototype);

/**
 * Creates a new internal model with the given engine
 * and the attributes initialized in the constructor.
 * 
 * @param {Engine} engine - The engine object to be assigned to the internalModel.
 */
Dataset.prototype._createInternalModel = function (engine) {
  return new AnalysisModel({
    id: this.getId(),
    type: 'source',
    query: 'SELECT * from ' + this._dataset
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};

function _checkDataset (dataset) {
  if (!dataset) {
    throw new TypeError('dataset is required.');
  }

  if (!_.isString(dataset)) {
    throw new Error('dataset must be a string.');
  }
}

module.exports = Dataset;
