var _ = require('underscore');
var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * A Dataset that can be used as the data source for layers and dataviews.
 *
 * @param {string} tableName The name of an existing table
 * @example
 * new carto.source.Dataset('european_cities');
 * @constructor
 * @extends carto.source.Base
 * @memberof carto.source
 * @api
 */
function Dataset (tableName) {
  _checkTableName(tableName);
  this._tableName = tableName;
  Base.apply(this, arguments);
}

Dataset.prototype = Object.create(Base.prototype);

/**
 * Return the table name being used in  this Dataset object.
 *
 * @return {string} - The table name being used in  this Dataset object
 * @api
 */
Dataset.prototype.getTableName = function () {
  return this._tableName;
};

/**
 * Creates a new internal model with the given engine and attributes initialized in the constructor.
 *
 * @param {Engine} engine - The engine object to be assigned to the internalModel
 */
Dataset.prototype._createInternalModel = function (engine) {
  var internalModel = new AnalysisModel({
    id: this.getId(),
    type: 'source',
    query: 'SELECT * from ' + this._dataset
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });

  return internalModel;
};

function _checkTableName (tableName) {
  if (!tableName) {
    throw new TypeError('Table name is required.');
  }

  if (!_.isString(tableName)) {
    throw new Error('Table name must be a string.');
  }
}

module.exports = Dataset;
