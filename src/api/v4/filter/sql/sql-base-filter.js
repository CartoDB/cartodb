const Base = require('../base');
const _ = require('underscore');

const ALLOWED_OPTIONS = ['includeNull'];
const DEFAULT_JOIN_OPERATOR = 'AND';

/**
 * SQL Filter
 *
 * A SQL filter is the base for all the SQL filters such as the Category Filter or the Range filter
 *
 * @param {string} column - The filtering will be performed against this column
 * @param {object} [filters] - The filters that you want to apply to the table rows
 * @param {object} [options]
 * @param {boolean} [options.includeNull] - The operation to apply to the data
 * @param {boolean} [options.reverseConditions] - The operation to apply to the data
 *
 *
 * @constructor
 * @extends carto.filter.Base
 * @memberof carto.filter
 * @api
 */
class SQLFilterBase extends Base {
  constructor (column, options = {}) {
    super();

    this._checkColumn(column);
    this._checkOptions(options);

    this._column = column;
    this._options = options;
  }

  set (filterType, filterValue) {
    const filter = { [filterType]: filterValue };

    this._checkFilters(filter);
    this._filters[filterType] = filterValue;

    this.trigger('change:filters', filter);
  }

  setFilters (filters) {
    this._checkFilters(filters);
    _.extend(this._filters, filters);

    this.trigger('change:filters', filters);
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
    Object.keys(filters)
      .forEach(filter => {
        const isFilterAllowed = _.contains(this.ALLOWED_FILTERS, filter);

        if (!isFilterAllowed) {
          console.error({filter}, 'is not allowed');
          // TODO: Return a better error
          throw this._getValidationError('filterNotFound');
        }
      });
  }

  _checkOptions (options) {
    Object.keys(options).forEach(filter => {
      const isOptionAllowed = _.contains(ALLOWED_OPTIONS, filter);

      if (!isOptionAllowed) {
        // TODO: Return a better error
        throw this._getValidationError('optionNotFound');
      }
    });
  }

  _getFilterStringValue (filterValue) {
    if (_.isDate(filterValue)) {
      return filterValue.toISOString();
    }

    if (_.isArray(filterValue)) {
      return filterValue
        .map(value => `'${value.toString()}'`)
        .join(',');
    }

    if (_.isNumber(filterValue)) {
      return filterValue.toString();
    }

    if (_.isObject(filterValue)) {
      return filterValue;
    }

    return `'${filterValue.toString()}'`;
  }

  _getSQLString () {
    return Object.keys(this._filters)
      .map(filterType => this._buildFilterString(filterType, this._filters[filterType]))
      .join(` ${DEFAULT_JOIN_OPERATOR} `);
  }

  _buildFilterString (filterType, filterValue) {
    const sqlStringTemplate = _.template(this.SQL_TEMPLATES[filterType]);
    return sqlStringTemplate({ column: this._column, value: this._getFilterStringValue(filterValue) });
  }
}

module.exports = SQLFilterBase;
