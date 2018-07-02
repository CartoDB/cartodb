const FiltersCollection = require('./filters-collection');

class AND extends FiltersCollection {
  constructor (filters) {
    super(filters);
    this.JOIN_OPERATOR = 'AND';
  }

  getSQL () {
    const sql = FiltersCollection.prototype.getSQL.apply(this);

    if (this.count() > 1) {
      return `(${sql})`;
    }

    return sql;
  }
}

module.exports = AND;
