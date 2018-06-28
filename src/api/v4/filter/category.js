const _ = require('underscore');
const SQLBase = require('./base-sql');

const CATEGORY_COMPARISON_OPERATORS = {
  IN: 'in',
  NOT_IN: 'notIn',
  EQ: 'eq',
  NOT_EQ: 'notEq',
  LIKE: 'like',
  SIMILAR_TO: 'similarTo'
};

const ALLOWED_FILTERS = Object.freeze(_.values(CATEGORY_COMPARISON_OPERATORS));

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

    this._checkFilters(filters);
    this._filters = filters;
  }

  _getSQLTemplates () {
    return {
      [CATEGORY_COMPARISON_OPERATORS.IN]: '<%= column %> IN (<%= value %>)',
      [CATEGORY_COMPARISON_OPERATORS.NOT_IN]: '<%= column %> NOT IN (<%= value %>)',
      [CATEGORY_COMPARISON_OPERATORS.EQ]: '<%= column %> = <%= value %>',
      [CATEGORY_COMPARISON_OPERATORS.NOT_EQ]: '<%= column %> != <%= value %>',
      [CATEGORY_COMPARISON_OPERATORS.LIKE]: '<%= column %> LIKE <%= value %>',
      [CATEGORY_COMPARISON_OPERATORS.SIMILAR_TO]: '<%= column %> SIMILAR TO <%= value %>'
    };
  }
}

module.exports = Category;
