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
 *
 * When including this filter into a {@link source.sql} or a {@link source.dataset}, the rows will be filtered by the conditions included within the filter.
 *
 * @class carto.filter.Category
 * @extends carto.filter.SQLBase
 * @memberof carto.filter
 * @api
 */
class Category extends SQLBase {
  /**
   * Create a Category Filter
   * @param {string} column - The column which the filter will be performed against
   * @param {object} filters - The filters that you want to apply to the table rows
   * @param {string[]} [filters.in] - Filter rows whose column value is included within the provided values
   * @param {string[]} [filters.notIn] - Filter rows whose column value is included within the provided values
   * @param {(string|number|Date)} [filters.eq] - Filter rows whose column value is equal to the provided value
   * @param {(string|number|Date)} [filters.notEq] - Filter rows whose column value is not equal to the provided value
   * @param {string} [filters.like] - Filter rows whose column value is like the provided value
   * @param {string} [filters.similarTo] - Filter rows whose column value is similar to the provided values
   * @param {object} [options]
   * @param {boolean} [options.includeNull] - The operation to apply to the data
   * @param {boolean} [options.reverseConditions] - The operation to apply to the data
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
