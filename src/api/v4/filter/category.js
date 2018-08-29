const SQLBase = require('./base-sql');

const CATEGORY_COMPARISON_OPERATORS = {
  in: { parameters: [{ name: 'in', allowedTypes: ['Array', 'String', 'Object'] }] },
  notIn: { parameters: [{ name: 'notIn', allowedTypes: ['Array', 'String', 'Object'] }] },
  eq: { parameters: [{ name: 'eq', allowedTypes: ['String', 'Number', 'Date'] }] },
  notEq: { parameters: [{ name: 'notEq', allowedTypes: ['String', 'Number', 'Date'] }] },
  like: { parameters: [{ name: 'like', allowedTypes: ['String'] }] },
  similarTo: { parameters: [{ name: 'similarTo', allowedTypes: ['String'] }] }
};

const ALLOWED_FILTERS = Object.freeze(Object.keys(CATEGORY_COMPARISON_OPERATORS));

/**
 * When including this filter into a {@link carto.source.SQL} or a {@link carto.source.Dataset}, the rows will be filtered by the conditions included within the filter.
 *
 * You can filter columns with `in`, `notIn`, `eq`, `notEq`, `like`, `similarTo` filters, and update the conditions with `.set()` or `.setFilters()` method. It will refresh the visualization automatically when any filter is added or modified.
 *
 * This filter won't include null values within returned rows by default but you can include them by setting `includeNull` option.
 *
 * @param {string} column - The column which the filter will be performed against
 * @param {object} filters - The filters you want to apply to the table rows
 * @param {string[]|string|object} filters.in - Return rows whose column value is included within the provided values
 * @param {string} filters.in.query - Return rows whose column value is included within query results
 * @param {string[]|string|object} filters.notIn - Return rows whose column value is included within the provided values
 * @param {string} filters.notIn.query - Return rows whose column value is not included within query results
 * @param {(string|number|Date)} filters.eq - Return rows whose column value is equal to the provided value
 * @param {(string|number|Date)} filters.notEq - Return rows whose column value is not equal to the provided value
 * @param {string} filters.like - Return rows whose column value is like the provided value
 * @param {string} filters.similarTo - Return rows whose column value is similar to the provided values
 * @param {object} [options]
 * @param {boolean} [options.includeNull] - Include null rows when returning data
 *
 * @example
 * // Create a filter by room type, showing only private rooms
 * const roomTypeFilter = new carto.filter.Category('room_type', { eq: 'Private Room' });
 * airbnbDataset.addFilter(roomTypeFilter);
 *
 * @example
 * // Create a filter by room type, showing only private rooms and entire apartments
 * const roomTypeFilter = new carto.filter.Category('room_type', { in: ['Private Room', 'Entire home/apt'] });
 * airbnbDataset.addFilter(roomTypeFilter);
 *
 * @example
 * // Create a filter by room type, showing results included in subquery
 * const roomTypeFilter = new carto.filter.Category('room_type', { in: { query: 'SELECT distinct(type) FROM rooms' } });
 * airbnbDataset.addFilter(roomTypeFilter);
 *
 * @class Category
 * @memberof carto.filter
 * @api
 */
class Category extends SQLBase {
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
      in: '<% if (value) { %><%= column %> IN (<%= value.query || value %>)<% } else { %>true = false<% } %>',
      notIn: '<% if (value) { %><%= column %> NOT IN (<%= value.query || value %>)<% } %>',
      eq: '<%= column %> = <%= value %>',
      notEq: '<%= column %> != <%= value %>',
      like: '<%= column %> LIKE <%= value %>',
      similarTo: '<%= column %> SIMILAR TO <%= value %>'
    };
  }

  /**
   * Set any of the filter conditions, overwriting the previous one.
   * @param {string} filterType - The filter type that you want to set. `in`, `notIn`, `eq`, `notEq`, `like`, `similarTo`.
   * @param {string} filterValue - The value of the filter. Check types in {@link carto.filter.Category}
   *
   * @memberof Category
   * @method set
   * @api
   */

  /**
   * Set filter conditions, overriding all the previous ones.
   * @param {object} filters - Object containing all the new filters to apply. Check filter options in {@link carto.filter.Category}.
   *
   * @memberof Category
   * @method setFilters
   * @api
   */
}

module.exports = Category;
