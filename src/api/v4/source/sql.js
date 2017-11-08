var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

/**
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
  this._id = 'fakeId';
  this._query = query;
}

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

SQL.prototype.$setEngine = function (engine) {
  if (!this._internalModel) {
    this._internalModel = new AnalysisModel({
      id: this._id,
      type: 'source',
      query: this._query
    }, {
      camshaftReference: CamshaftReference,
      engine: engine
    });
  }
};

SQL.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = SQL;
