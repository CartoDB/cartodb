const _ = require('underscore');
const Base = require('./base');

const ALLOWED_OPTIONS = ['includeNull'];
const DEFAULT_JOIN_OPERATOR = 'AND';

/**
 * SQL Filter
 *
 * A SQL filter is the base for all the SQL filters such as the Category Filter or the Range filter
 *
 * @class carto.filter.SQLBase
 * @extends carto.filter.Base
 * @memberof carto.filter
 * @api
 */
class SQLBase extends Base {
  /**
   * Creates an instance of SQLBase.
   * @param {string} column - The filtering will be performed against this column
   * @param {object} [options={}]
   * @param {boolean} [options.includeNull] - The operation to apply to the data
   * @param {boolean} [options.reverseConditions] - The operation to apply to the data
   * @memberof carto.filter.SQLBase
   */
  constructor (column, options = {}) {
    super();

    this._checkColumn(column);
    this._checkOptions(options);

    this._column = column;
    this._filters = {};
    this._options = options;
  }

  set (filterType, filterValue) {
    const newFilter = { [filterType]: filterValue };

    this._checkFilters(newFilter);
    this._filters[filterType] = filterValue;

    this.trigger('change:filters', newFilter);
  }

  setFilters (filters) {
    this._checkFilters(filters);
    this._filters = filters;

    this.trigger('change:filters', filters);
  }

  getSQL () {
    return Object.keys(this._filters)
      .map(filterType => this._interpolateFilterIntoTemplate(filterType, this._filters[filterType]))
      .join(` ${DEFAULT_JOIN_OPERATOR} `);
  }

  _checkColumn (column) {
    if (_.isUndefined(column)) {
      throw this._getValidationError('columnRequired');
    }

    if (!_.isString(column)) {
      throw this._getValidationError('columnString');
    }

    if (_.isEmpty(column)) {
      throw this._getValidationError('emptyColumn');
    }
  }

  _checkFilters (filters) {
    Object.keys(filters).forEach(filter => {
      const isFilterValid = _.contains(this.ALLOWED_FILTERS, filter);

      if (!isFilterValid) {
        throw this._getValidationError(`invalidFilter${filter}`);
      }
    });
  }

  _checkOptions (options) {
    Object.keys(options).forEach(option => {
      const isOptionValid = _.contains(ALLOWED_OPTIONS, option);

      if (!isOptionValid) {
        throw this._getValidationError(`invalidOption${option}`);
      }
    });
  }

  _convertValueToSQLString (filterValue) {
    if (_.isDate(filterValue)) {
      return filterValue.toISOString();
    }

    if (_.isArray(filterValue)) {
      return filterValue
        .map(value => `'${value.toString()}'`)
        .join(',');
    }

    if (_.isObject(filterValue) || _.isNumber(filterValue)) {
      return filterValue;
    }

    return `'${filterValue.toString()}'`;
  }

  _interpolateFilterIntoTemplate (filterType, filterValue) {
    const sqlString = _.template(this.SQL_TEMPLATES[filterType]);
    return sqlString({ column: this._column, value: this._convertValueToSQLString(filterValue) });
  }
}

module.exports = SQLBase;
