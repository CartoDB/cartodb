var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
<<<<<<< HEAD
=======
 * A SQL Query that can be used as the data source for layers and dataviews.
 * 
>>>>>>> internal-classes-layers
 * @param {string} query A SQL query containing a SELECT statement
 *
 * @example
 *
 * new carto.source.SQL('SELECT * FROM european_cities');
 * 
 * @constructor
 * @extends carto.source.Base
 * @memberof carto.source
 * @api
 *
 */
function SQL (query) {
<<<<<<< HEAD
  this._id = 'fakeId';
=======
>>>>>>> internal-classes-layers
  this._query = query;
  Base.apply(this, arguments);
}

SQL.prototype = Object.create(Base.prototype);

/**
 * Store the query internally and if in the internal model when exists.
 * 
 * @param {string} query - The sql query that will be the source of the data. 
 */
SQL.prototype.setQuery = function (query) {
  this._query = query;
  if (this._internalModel) {
    this._internalModel.set('query', query);
  }
  return this;
};

/**
 * Get the query being used in this SQL source.
 */
SQL.prototype.getQuery = function () {
  return this._query;
};

/**
 * Creates a new internal model with the given engine
 * and the attributes initialized in the constructor.
 * 
 * @param {Engine} engine - The engine object to be assigned to the internalModel.
 */
SQL.prototype._createInternalModel = function (engine) {
  return new AnalysisModel({
    id: this.getId(),
    type: 'source',
    query: this._query
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};

module.exports = SQL;
