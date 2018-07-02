const _ = require('underscore');
const Base = require('./base');
const SQLBase = require('./base-sql');

const DEFAULT_JOIN_OPERATOR = 'AND';

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

  addFilter (filter) {
    if (!(filter instanceof SQLBase) && !(filter instanceof FiltersCollection)) {
      throw this._getValidationError('wrongFilterType');
    }

    if (_.contains(this._filters, filter)) return;

    filter.on('change:filters', filters => this._triggerFilterChange(filters));
    this._filters.push(filter);
    this._triggerFilterChange();
  }

  removeFilter (filter) {
    if (!_.contains(this._filters, filter)) return;

    const removedElement = this._filters.splice(_.indexOf(filter), 1);
    this._triggerFilterChange();
    return removedElement;
  }

  count () {
    return this._filters.length;
  }

  getSQL () {
    return this._filters.map(filter => filter.getSQL())
      .join(` ${this.JOIN_OPERATOR || DEFAULT_JOIN_OPERATOR} `);
  }

  _triggerFilterChange (filters) {
    this.trigger('change:filters', filters);
  }
}

module.exports = FiltersCollection;
