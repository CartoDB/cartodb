var _ = require('underscore');
var Base = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');
var CartoValidationError = require('../error-handling/carto-validation-error');
var CartoError = require('../error-handling/carto-error');

/**
 * A Dataset that can be used as the data source for layers and dataviews.
 *
 * @param {string} tableName The name of an existing table
 * @example
 * new carto.source.Dataset('european_cities');
 * @constructor
 * @fires error
 * @extends carto.source.Base
 * @memberof carto.source
 * @api
 */
function Dataset (tableName) {
  _checkTableName(tableName);
  this._tableName = tableName;

  Base.apply(this, arguments);

  this._appliedFilters.on('change:filters', () => this._updateInternalModelQuery(this._getQueryToApply()));
}

Dataset.prototype = Object.create(Base.prototype);

/**
 * Update the table name. This method is asyncronous and returns a promise which is resolved when the style
 * is changed succesfully. It also fires a 'tableNameChanged' event.
 *
 * @param {string} tableName The name of an existing table
 * @fires TableNameChanged
 * @returns {Promise} - A promise that will be fulfilled when the reload cycle is completed
 * @api
 */
Dataset.prototype.setTableName = function (tableName) {
  _checkTableName(tableName);

  this._tableName = tableName;

  if (!this._internalModel) {
    this._triggerTableNameChanged(this, tableName);
    return Promise.resolve();
  }

  return this._updateInternalModelQuery(this._getQueryToApply());
};

/**
 * Return the table name being used in  this Dataset object.
 *
 * @return {string} The table name being used in  this Dataset object
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
    query: this._getQueryToApply()
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });

  return internalModel;
};

Dataset.prototype._updateInternalModelQuery = function (query) {
  if (!this._internalModel) return;

  this._internalModel.set('query', query, { silent: true });

  return this._internalModel._engine.reload()
    .then(() => this._triggerTableNameChanged(this, this._tableName))
    .catch(windshaftError => Promise.reject(new CartoError(windshaftError)));
};

Dataset.prototype._getQueryToApply = function () {
  const whereClause = this._appliedFilters.$getSQL();
  const datasetQuery = `SELECT * from ${this._tableName}`;

  if (_.isEmpty(whereClause)) {
    return datasetQuery;
  }

  return `SELECT * FROM (${datasetQuery}) as datasetQuery WHERE ${whereClause}`;
};

Dataset.prototype.addFilter = function (filter) {
  Base.prototype.addFilter.apply(this, arguments);
  this._updateInternalModelQuery(this._getQueryToApply());
};

Dataset.prototype.removeFilter = function (filters) {
  Base.prototype.removeFilter.apply(this, arguments);
  this._updateInternalModelQuery(this._getQueryToApply());
};

Dataset.prototype._triggerTableNameChanged = function (model, value) {
  this.trigger('tableNameChanged', value);
};

function _checkTableName (tableName) {
  if (_.isUndefined(tableName)) {
    throw new CartoValidationError('source', 'noDatasetName');
  }
  if (!_.isString(tableName)) {
    throw new CartoValidationError('source', 'requiredDatasetString');
  }
  if (_.isEmpty(tableName)) {
    throw new CartoValidationError('source', 'requiredDataset');
  }
}

module.exports = Dataset;
