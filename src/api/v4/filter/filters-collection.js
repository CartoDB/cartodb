const _ = require('underscore');
const Base = require('./base');
const SQLBase = require('./base-sql');

const DEFAULT_JOIN_OPERATOR = 'AND';

/**
 * Filters Collection.
 *
 * Base class for AND and OR filters.
 *
 * Filters Collection is a way to group a set of filters in order to create composed filters, allowing the user to change the operator that joins the filters.
 *
 * **This object should not be used directly.**
 *
 * @class FiltersCollection
 * @memberof carto.filter
 * @api
 */
class FiltersCollection extends Base {
  constructor (filters) {
    super();
    this._initialize(filters);
  }

  _initialize (filters) {
    this._filters = [];

    if (filters && filters.length) {
      filters.map(filter => this.addFilter(filter));
    }
  }

  /**
   * Add a new filter to the collection
   *
   * @param {(carto.filter.Range|carto.filter.Category|carto.filter.AND|carto.filter.OR)} filter
   * @memberof FiltersCollection
   * @api
   */
  addFilter (filter) {
    if (!(filter instanceof SQLBase) && !(filter instanceof FiltersCollection)) {
      throw this._getValidationError('wrongFilterType');
    }

    if (_.contains(this._filters, filter)) return;

    filter.on('change:filters', filters => this._triggerFilterChange(filters));
    this._filters.push(filter);
    this._triggerFilterChange();
  }

  /**
   * Remove an existing filter from the collection
   *
   * @param {(carto.filter.Range|carto.filter.Category|carto.filter.AND|carto.filter.OR)} filter
   * @returns {(carto.filter.Range|carto.filter.Category|carto.filter.AND|carto.filter.OR)} The removed element
   * @memberof FiltersCollection
   * @api
   */
  removeFilter (filter) {
    if (!_.contains(this._filters, filter)) return;

    const removedElement = this._filters.splice(_.indexOf(filter), 1);
    this._triggerFilterChange();
    return removedElement;
  }

  /**
   * Get the number of added filters to the collection
   *
   * @returns {number} Number of contained filters
   * @memberof FiltersCollection
   * @api
   */
  count () {
    return this._filters.length;
  }

  $getSQL () {
    const sql = this._filters.map(filter => filter.$getSQL())
      .join(` ${this.JOIN_OPERATOR || DEFAULT_JOIN_OPERATOR} `);

    if (this.count() > 1) {
      return `(${sql})`;
    }

    return sql;
  }

  _triggerFilterChange (filters) {
    this.trigger('change:filters', filters);
  }
}

module.exports = FiltersCollection;
