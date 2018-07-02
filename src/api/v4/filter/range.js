const SQLBase = require('./base-sql');

const RANGE_COMPARISON_OPERATORS = {
  lt: { parameters: [{ name: 'lt', allowedTypes: ['Number', 'Date'] }] },
  lte: { parameters: [{ name: 'lte', allowedTypes: ['Number', 'Date'] }] },
  gt: { parameters: [{ name: 'gt', allowedTypes: ['Number', 'Date'] }] },
  gte: { parameters: [{ name: 'gte', allowedTypes: ['Number', 'Date'] }] },
  between: {
    parameters: [
      { name: 'min', allowedTypes: ['Number', 'Date'] },
      { name: 'max', allowedTypes: ['Number', 'Date'] }
    ]
  },
  notBetween: {
    parameters: [
      { name: 'min', allowedTypes: ['Number', 'Date'] },
      { name: 'max', allowedTypes: ['Number', 'Date'] }
    ]
  },
  betweenSymmetric: {
    parameters: [
      { name: 'min', allowedTypes: ['Number', 'Date'] },
      { name: 'max', allowedTypes: ['Number', 'Date'] }
    ]
  },
  notBetweenSymmetric: {
    parameters: [
      { name: 'min', allowedTypes: ['Number', 'Date'] },
      { name: 'max', allowedTypes: ['Number', 'Date'] }
    ]
  }
};

const ALLOWED_FILTERS = Object.freeze(Object.keys(RANGE_COMPARISON_OPERATORS));

/**
 * Range Filter
 *
 * When including this filter into a {@link source.sql} or a {@link source.dataset}, the rows will be filtered by the conditions included within filters.
 *
 * @class carto.filter.Range
 * @extends carto.filter.SQLBaseFilter
 * @memberof carto.filter
 * @api
 */
class Range extends SQLBase {
  /**
   * Create a Range filter
   * //TODO: poner not between y not between symmetric
   * @param {string} column - The column to filter rows
   * @param {object} [filters] - The filters you want to apply to the column
   * @param {(number|Date)} [filters.lt] - Filter rows whose column value is less than the provided value
   * @param {(number|Date)} [filters.lte] - Filter rows whose column value is less than or equal to the provided value
   * @param {(number|Date)} [filters.gt] - Filter rows whose column value is greater than to the provided value
   * @param {(number|Date)} [filters.gte] - Filter rows whose column value is greater than or equal to the provided value
   * @param {(number|Date)} [filters.between] - Filter rows whose column value is between the provided values
   * @param {(number|Date)} [filters.between.min] - Lowest value of the comparison range
   * @param {(number|Date)} [filters.between.max] - Upper value of the comparison range
   * @param {(number|Date)} [filters.betweenSymmetric] - Filter rows whose column value is between the provided values after sorting them
   * @param {(number|Date)} [filters.betweenSymmetric.min] - Lowest value of the comparison range
   * @param {(number|Date)} [filters.betweenSymmetric.max] - Upper value of the comparison range
   * @param {object} [options]
   * @param {boolean} [options.includeNull] - The operation to apply to the data
   * @param {boolean} [options.reverseConditions] - The operation to apply to the data
   */
  constructor (column, filters = {}, options) {
    super(column, options);

    this.SQL_TEMPLATES = this._getSQLTemplates();
    this.ALLOWED_FILTERS = ALLOWED_FILTERS;
    this.PARAMETER_SPECIFICATION = RANGE_COMPARISON_OPERATORS;

    this._checkFilters(filters);
    this._filters = filters;
  }

  _getSQLTemplates () {
    return {
      lt: '<%= column %> < <%= value %>',
      lte: '<%= column %> <= <%= value %>',
      gt: '<%= column %> > <%= value %>',
      gte: '<%= column %> >= <%= value %>',
      between: '<%= column %> BETWEEN <%= value.min %> AND <%= value.max %>',
      notBetween: '<%= column %> NOT BETWEEN <%= value.min %> AND <%= value.max %>',
      betweenSymmetric: '<%= column %> BETWEEN SYMMETRIC <%= value.min %> AND <%= value.max %>',
      notBetweenSymmetric: '<%= column %> NOT BETWEEN SYMMETRIC <%= value.min %> AND <%= value.max %>'
    };
  }
}

module.exports = Range;
