var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * The SQL object allows to get data from a table in the database through
 * an sql query.
 * 
 * This data can be used as source in a Layer or a Dataset.
 * 
 * 
 * @param {string} [id] - A unique ID for this source
 * @param {string} query A SQL query containing a SELECT statement
 * 
 * @example
 *
 * // no options
 * new carto.source.SQL('SELECT * FROM european_cities');
 * 
 * @example
 *
 * // with options
 * new carto.source.SQL('SELECT * FROM european_cities', { id: 'european_cities' });
 * 
 * @constructor
 * @api
 * @memberof carto.source
 *
 */
function SQL (query, options) {
  options = options || {};
  this._id = options.id || SQL.$generateId;
  this._query = query;
}

/**
 * Creates a new internal model with the given engine
 * and the attributes initialized in the constructor.
 * 
 * @param {Engine} engine - The engine object to be assigned to the internalModel.
 */
SQL.prototype.$setEngine = function (engine) {
  this._internalModel = new AnalysisModel({
    id: this._id,
    type: 'source',
    query: this._query
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};

SQL.prototype.$getInternalModel = function () {
  return this._internalModel;
};

SQL.$nextId = 0;
SQL.$generateId = function () {
  return 'S' + ++SQL.$nextId;
};

module.exports = SQL;
