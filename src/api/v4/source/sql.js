var _ = require('underscore');
var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');
var CartoValidationError = require('../error-handling/carto-validation-error');
var CartoError = require('../error-handling/carto-error');

/**
 * A SQL Query that can be used as the data source for layers and dataviews.
 *
 * @param {string} query A SQL query containing a SELECT statement
 * @fires error
 * @example
 * new carto.source.SQL('SELECT * FROM european_cities');
 * @constructor
 * @extends carto.source.Base
 * @memberof carto.source
 * @fires queryChanged
 * @api
 */
function SQL (query) {
  _checkQuery(query);
  this._query = query;

  Base.apply(this, arguments);

  this._appliedFilters.on('change:filters', () => this._updateInternalModelQuery(this._getQueryToApply()));
}

SQL.prototype = Object.create(Base.prototype);

/**
 * Update the query. This method is asyncronous and returns a promise which is resolved when the style
 * is changed succesfully. It also fires a 'queryChanged' event.
 *
 * @param {string} query - The sql query that will be the source of the data
 * @fires queryChanged
 * @returns {Promise} - A promise that will be fulfilled when the reload cycle is completed
 * @api
 */
SQL.prototype.setQuery = function (query) {
  _checkQuery(query);
  this._query = query;

  const sqlString = this._getQueryToApply();

  if (!this._internalModel) {
    this._triggerQueryChanged(this, sqlString);
    return Promise.resolve();
  }

  return this._updateInternalModelQuery(sqlString);
};

/**
 * Get the query being used in this SQL source.
 *
 * @return {string} The query being used in this SQL object
 * @api
 */
SQL.prototype.getQuery = function () {
  return this._query;
};

/**
 * Creates a new internal model with the given engine and attributes initialized in the constructor.
 *
 * @param {Engine} engine - The engine object to be assigned to the internalModel
 */
SQL.prototype._createInternalModel = function (engine) {
  var internalModel = new AnalysisModel({
    id: this.getId(),
    type: 'source',
    query: this._getQueryToApply()
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });

  internalModel.on('change:query', this._triggerQueryChanged, this);

  return internalModel;
};

SQL.prototype._updateInternalModelQuery = function (query) {
  if (!this._internalModel) return;

  this._internalModel.set('query', query, { silent: true });

  return this._internalModel._engine.reload()
    .then(() => this._triggerQueryChanged(this, query))
    .catch(windshaftError => Promise.reject(new CartoError(windshaftError)));
};

SQL.prototype._getQueryToApply = function () {
  const whereClause = this._appliedFilters.$getSQL();

  if (!this._hasFiltersApplied || _.isEmpty(whereClause)) {
    return this._query;
  }

  return `SELECT * FROM (${this._query}) as originalQuery WHERE ${whereClause}`;
};

SQL.prototype.addFilter = function (filter) {
  Base.prototype.addFilter.apply(this, arguments);
  this._updateInternalModelQuery(this._getQueryToApply());
};

SQL.prototype.removeFilter = function (filters) {
  Base.prototype.removeFilter.apply(this, arguments);
  this._updateInternalModelQuery(this._getQueryToApply());
};

SQL.prototype._triggerQueryChanged = function (model, value) {
  this.trigger('queryChanged', value);
};

function _checkQuery (query) {
  if (!query) {
    throw new CartoValidationError('source', 'requiredQuery');
  }

  if (!_.isString(query)) {
    throw new CartoValidationError('source', 'requiredString');
  }
}

module.exports = SQL;

/**
 * Fired when the query has changed. Handler gets a parameter with the new query.
 *
 * @event queryChanged
 * @type {string}
 * @api
 */
