const SQLBase = require('./base-sql');

const RANGE_COMPARISON_OPERATORS = {
  lt: { parameters: [{ name: 'lt', allowedTypes: ['Number', 'Date', 'Object'] }] },
  lte: { parameters: [{ name: 'lte', allowedTypes: ['Number', 'Date', 'Object'] }] },
  gt: { parameters: [{ name: 'gt', allowedTypes: ['Number', 'Date', 'Object'] }] },
  gte: { parameters: [{ name: 'gte', allowedTypes: ['Number', 'Date', 'Object'] }] },
  between: {
    parameters: [
      { name: 'between.min', allowedTypes: ['Number', 'Date'] },
      { name: 'between.max', allowedTypes: ['Number', 'Date'] }
    ]
  },
  notBetween: {
    parameters: [
      { name: 'notBetween.min', allowedTypes: ['Number', 'Date'] },
      { name: 'notBetween.max', allowedTypes: ['Number', 'Date'] }
    ]
  },
  betweenSymmetric: {
    parameters: [
      { name: 'betweenSymmetric.min', allowedTypes: ['Number', 'Date'] },
      { name: 'betweenSymmetric.max', allowedTypes: ['Number', 'Date'] }
    ]
  },
  notBetweenSymmetric: {
    parameters: [
      { name: 'notBetweenSymmetric.min', allowedTypes: ['Number', 'Date'] },
      { name: 'notBetweenSymmetric.max', allowedTypes: ['Number', 'Date'] }
    ]
  }
};

const ALLOWED_FILTERS = Object.freeze(Object.keys(RANGE_COMPARISON_OPERATORS));

/**
 * When including this filter into a {@link carto.source.SQL} or a {@link carto.source.Dataset}, the rows will be filtered by the conditions included within the filter.
 *
 * You can filter columns with `in`, `notIn`, `eq`, `notEq`, `like`, `similarTo` filters, and update the conditions with `.set()` or `.setFilters()` method. It will refresh the visualization automatically when any filter is added or modified.
 *
 * This filter won't include null values within returned rows by default but you can include them by setting `includeNull` option.
 *
 * @param {string} column - The column to filter rows
 * @param {object} filters - The filters you want to apply to the column
 * @param {(number|Date|object)} filters.lt - Return rows whose column value is less than the provided value
 * @param {string} filters.lt.query - Return rows whose column value is less than the value returned by query
 * @param {(number|Date|object)} filters.lte - Return rows whose column value is less than or equal to the provided value
 * @param {string} filters.lte.query - Return rows whose column value is less than or equal to the value returned by query
 * @param {(number|Date|object)} filters.gt - Return rows whose column value is greater than the provided value
 * @param {string} filters.gt.query - Return rows whose column value is greater than the value returned by query
 * @param {(number|Date|object)} filters.gte - Return rows whose column value is greater than or equal to the provided value
 * @param {string} filters.gte.query - Return rows whose column value is greater than or equal to the value returned by query
 * @param {(number|Date)} filters.between - Return rows whose column value is between the provided values
 * @param {(number|Date)} filters.between.min - Lower value of the comparison range
 * @param {(number|Date)} filters.between.max - Upper value of the comparison range
 * @param {(number|Date)} filters.notBetween - Return rows whose column value is not between the provided values
 * @param {(number|Date)} filters.notBetween.min - Lower value of the comparison range
 * @param {(number|Date)} filters.notBetween.max - Upper value of the comparison range
 * @param {(number|Date)} filters.betweenSymmetric - Return rows whose column value is between the provided values after sorting them
 * @param {(number|Date)} filters.betweenSymmetric.min - Lower value of the comparison range
 * @param {(number|Date)} filters.betweenSymmetric.max - Upper value of the comparison range
 * @param {(number|Date)} filters.notBetweenSymmetric - Return rows whose column value is not between the provided values after sorting them
 * @param {(number|Date)} filters.notBetweenSymmetric.min - Lower value of the comparison range
 * @param {(number|Date)} filters.notBetweenSymmetric.max - Upper value of the comparison range
 * @param {object} [options]
 * @param {boolean} [options.includeNull] - Include null rows when returning data
 *
 * @example
 * // Create a filter by price, showing only listings lower than or equal to 50€, and higher than 100€
 * const priceFilter = new carto.filter.Range('price', { lte: 50, gt: 100 });
 *
 * // Add filter to the existing source
 * airbnbDataset.addFilter(priceFilter);
 *
 * @class Range
 * @extends carto.filter.Base
 * @memberof carto.filter
 * @api
 */
class Range extends SQLBase {
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
      lt: '<%= column %> < <%= value.query || value %>',
      lte: '<%= column %> <= <%= value.query || value %>',
      gt: '<%= column %> > <%= value.query || value %>',
      gte: '<%= column %> >= <%= value.query || value %>',
      between: '<%= column %> BETWEEN <%= value.min %> AND <%= value.max %>',
      notBetween: '<%= column %> NOT BETWEEN <%= value.min %> AND <%= value.max %>',
      betweenSymmetric: '<%= column %> BETWEEN SYMMETRIC <%= value.min %> AND <%= value.max %>',
      notBetweenSymmetric: '<%= column %> NOT BETWEEN SYMMETRIC <%= value.min %> AND <%= value.max %>'
    };
  }

  /**
   * Set any of the filter conditions, overwriting the previous one.
   * @param {string} filterType - The filter type that you want to set. `lt`, `lte`, `gt`, `gte`, `between`, `notBetween`, `betweenSymmetric`, `notBetweenSymmetric`.
   * @param {string} filterValue - The value of the filter. Check types in {@link carto.filter.Range}
   *
   * @memberof Range
   * @method set
   * @api
   */

  /**
   * Set filter conditions, overriding all the previous ones.
   * @param {object} filters - Object containing all the new filters to apply. Check filter options in {@link carto.filter.Range}.
   *
   * @memberof Range
   * @method setFilters
   * @api
   */

  /**
   * Remove all conditions from current filter
   *
   * @memberof Range
   * @method resetFilters
   * @api
   */
}

module.exports = Range;
