var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * @param {string} [id] - A unique ID for this source
 * @param {string} query A SQL query containing a SELECT statement
 * 
 * @example
 *
 * new carto.source.SQL('european_cities', 'SELECT * FROM european_cities');
 * 
 * @example
 *
 * new carto.source.SQL('SELECT * FROM european_cities');
 * 
 * @constructor
 * @api
 * @memberof carto.source
 *
 */
function SQL (id, query) {
  if (typeof query === 'undefined') {
    query = id;
    id = 'fakeId'; // TODO: Generate a unique ID
  }

  this._id = id;
  this._query = query;
}

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

module.exports = SQL;
