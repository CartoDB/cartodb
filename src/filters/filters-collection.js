const _ = require('underscore');
const Base = require('../api/v4/filter/base');
const SQLBase = require('../api/v4/filter/base-sql');

const DEFAULT_JOIN_OPERATOR = 'AND';

class FiltersCollection extends Base {
  constructor (filters) {
    super();
    this._initialize(filters);
  }

  _initialize (filters) {
    this._filters = [];

    if (filters && filters.length) {
      filters.map(filter => this.add(filter));
    }
  }

  add (filter) {
    if (!(filter instanceof SQLBase)) {
      throw this._getValidationError('wrongFilterType');
    }

    if (_.contains(this._filters, filter)) return;

    filter.on('change:filters', filters => this._triggerFilterChange(filters));
    this._filters.push(filter);
  }

  remove (filter) {
    if (!_.contains(this._filters, filter)) return;

    return this._filters.splice(_.indexOf(filter), 1);
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

class AND extends FiltersCollection {
  constructor (filters) {
    super(filters);
    this.JOIN_OPERATOR = 'AND';
  }
}

class OR extends FiltersCollection {
  constructor (filters) {
    super(filters);
    this.JOIN_OPERATOR = 'OR';
  }
}

module.exports = {
  FiltersCollection,
  AND,
  OR
};
