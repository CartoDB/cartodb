var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
 * A SQL Query that can be used as the data source for layers and dataviews.
 * 
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
  this._query = query;

  Base.apply(this, arguments);
}

/**
 * Creates a new internal model with the given engine
 * and the attributes initialized in the constructor.
 * 
 * @param {Engine} engine - The engine object to be assigned to the internalModel.
 */
SQL.prototype = Object.create(Base.prototype);

SQL.prototype.setQuery = function (query) {
  this._query = query;
  if (this._internalModel) {
    this._internalModel.set('query', query);
  }
  return this;
};

SQL.prototype.getQuery = function () {
  return this._query;
};

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

SQL.prototype.$getInternalModel = function () {
  return this._internalModel;
};

SQL.$nextId = 0;
SQL.$generateId = function () {
  return 'S' + ++SQL.$nextId;
};

module.exports = SQL;
