var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
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
  this.id = options.id || SQL.$generateId;
  this._query = query;
}

SQL.prototype.$setEngine = function (engine) {
  this._internalModel = new AnalysisModel({
    id: this.id,
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
