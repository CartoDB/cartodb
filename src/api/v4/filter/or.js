const FiltersCollection = require('./filters-collection');

class OR extends FiltersCollection {
  constructor (filters) {
    super(filters);
    this.JOIN_OPERATOR = 'OR';
  }

  getSQL () {
    const sql = FiltersCollection.prototype.getSQL.apply(this);

    if (this.count() > 1) {
      return `(${sql})`;
    }

    return sql;
  }
}

module.exports = OR;
