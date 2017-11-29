var _ = require('underscore');
var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');
var CartoError = require('../error');

/**
 * A SQL Query that can be used as the data source for layers and dataviews.
 *
 * @param {string} query A SQL query containing a SELECT statement
 * @example
 * new carto.source.SQL('SELECT * FROM european_cities');
 * @constructor
 * @extends carto.source.Base
 * @memberof carto.source
 * @fires carto.source.SQL.queryChangedEvent
 * @api
 */
function SQL (query) {
  _checkQuery(query);
  this._query = query;
  Base.apply(this, arguments);
}

SQL.prototype = Object.create(Base.prototype);

/**
 * Update the query. This method is asyncronous and returns a promise which is resolved when the style
 * is changed succesfully. It also fires a queryChangedEvent.
 * 
 * @param {string} query - The sql query that will be the source of the data
 * @fires carto.source.SQL.queryChangedEvent
 * @returns {Promise} - A promise that will be fulfilled when the reload cycle is completed
 * @api
 */
SQL.prototype.setQuery = function (query) {
  _checkQuery(query);
  this._query = query;
  if (!this._internalModel) {
    this._triggerQueryChanged(this, query);
    return Promise.resolve();
  }
  this._internalModel.set('query', query, { silent: true });

  return this._internalModel._engine.reload()
    .then(function () {
      this._triggerQueryChanged(this, query);
    }.bind(this))
    .catch(function (windshaftError) {
      return Promise.reject(new CartoError(windshaftError));
    });
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
    query: this._query
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });

  internalModel.on('change:query', this._triggerQueryChanged, this);

  return internalModel;
};

SQL.prototype._triggerQueryChanged = function (model, value) {
  this.trigger('queryChanged', value);
};

function _checkQuery (query) {
  if (!query) {
    throw new TypeError('query is required.');
  }

  if (!_.isString(query)) {
    throw new Error('query must be a string.');
  }
}

module.exports = SQL;

/**
 * Triggered every time the query is changed.
 * Contains a string with the new query.
 *
 * @event carto.source.SQL.queryChangedEvent
 * @type {string}
 * @api
 */
