const SQLBase = require('./base-sql');

const CATEGORY_COMPARISON_OPERATORS = {
  in: { parameters: [{ name: 'in', allowedTypes: ['Array', 'String'] }] },
  notIn: { parameters: [{ name: 'notIn', allowedTypes: ['Array', 'String'] }] },
  eq: { parameters: [{ name: 'eq', allowedTypes: ['String', 'Number', 'Date'] }] },
  notEq: { parameters: [{ name: 'notEq', allowedTypes: ['String', 'Number', 'Date'] }] },
  like: { parameters: [{ name: 'like', allowedTypes: ['String'] }] },
  similarTo: { parameters: [{ name: 'similarTo', allowedTypes: ['String'] }] }
};

const ALLOWED_FILTERS = Object.freeze(Object.keys(CATEGORY_COMPARISON_OPERATORS));

/**
 * Category Filter
 * SQL and Dataset source filter.
 *
 * When including this filter into a {@link carto.source.SQL} or a {@link carto.source.Dataset}, the rows will be filtered by the conditions included within the filter.
 *
 * You can filter columns with `in`, `notIn`, `eq`, `notEq`, `like`, `similarTo` filters, and update the conditions with `.set()` or `.setFilters()` method. It will refresh the visualization automatically when any filter is added or modified.
 *
 * This filter won't include null values within returned rows by default but you can include them by setting `includeNull` option.
 *
 * @param {string} column - The column which the filter will be performed against
 * @param {object} filters - The filters that you want to apply to the table rows
 * @param {string[]} filters.in - Return rows whose column value is included within the provided values
 * @param {string[]} filters.notIn - Return rows whose column value is included within the provided values
 * @param {(string|number|Date)} filters.eq - Return rows whose column value is equal to the provided value
 * @param {(string|number|Date)} filters.notEq - Return rows whose column value is not equal to the provided value
 * @param {string} filters.like - Return rows whose column value is like the provided value
 * @param {string} filters.similarTo - Return rows whose column value is similar to the provided values
 * @param {object} [options]
 * @param {boolean} [options.includeNull] - The operation to apply to the data
 *
 * @example
 * // Create a filter by room type, showing only private rooms
 * const roomTypeFilter = new carto.filter.Category('room_type', { eq: 'Entire home/apt' });
 * airbnbDataset.addFilter(roomTypeFilter);
 *
 * @class Category
 * @memberof carto.filter
 * @api
 */
class Category extends SQLBase {
  /**
   * Create a Category Filter
   * @param {string} column - The column which the filter will be performed against
   * @param {object} filters - The filters that you want to apply to the table rows
   * @param {string[]} filters.in - Return rows whose column value is included within the provided values
   * @param {string[]} filters.notIn - Return rows whose column value is included within the provided values
   * @param {(string|number|Date)} filters.eq - Return rows whose column value is equal to the provided value
   * @param {(string|number|Date)} filters.notEq - Return rows whose column value is not equal to the provided value
   * @param {string} filters.like - Return rows whose column value is like the provided value
   * @param {string} filters.similarTo - Return rows whose column value is similar to the provided values
   * @param {object} [options]
   * @param {boolean} [options.includeNull] - The operation to apply to the data
   */
  constructor (column, filters = {}, options) {
    super(column, options);

    this.SQL_TEMPLATES = this._getSQLTemplates();
    this.ALLOWED_FILTERS = ALLOWED_FILTERS;
    this.PARAMETER_SPECIFICATION = CATEGORY_COMPARISON_OPERATORS;

    this._checkFilters(filters);
    this._filters = filters;
  }

  _getSQLTemplates () {
    return {
      in: '<%= column %> IN (<%= value %>)',
      notIn: '<%= column %> NOT IN (<%= value %>)',
      eq: '<%= column %> = <%= value %>',
      notEq: '<%= column %> != <%= value %>',
      like: '<%= column %> LIKE <%= value %>',
      similarTo: '<%= column %> SIMILAR TO <%= value %>'
    };
  }
}

module.exports = Category;
