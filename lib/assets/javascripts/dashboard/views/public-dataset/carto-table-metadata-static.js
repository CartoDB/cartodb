const _ = require('underscore');

module.exports = {
  sortSchema: function (schema) {
    var priorities = {
      'cartodb_id': 1,
      'the_geom': 2,
      '__default__': 3,
      'created_at': 4,
      'updated_at': 5
    };

    function priority (v) {
      return priorities[v] || priorities['__default__'];
    }

    return _.chain(schema)
      .clone()
      .sort(function (a, b) { // ..and then re-sort by priorities defined above
        var prioA = priority(a[0]);
        var prioB = priority(b[0]);
        if (prioA < prioB) {
          return -1;
        } else if (prioA > prioB) {
          return 1;
        } else { // priority is the same (i.e. __default__), so compare alphabetically
          return a[0] < b[0] ? -1 : 1;
        }
      })
      .value();
  },

  /**
   * return true if the sql query alters table schema in some way
   */
  alterTable: function (sql) {
    sql = sql.trim();
    return sql.search(/alter\s+[\w\."]+\s+/i) !== -1 ||
           sql.search(/drop\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^vacuum\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^create\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^reindex\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^grant\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^revoke\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^cluster\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^comment\s+on\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^explain\s+[\w\.\"]+/i) !== -1;
  },

  /**
   * return true if the sql query alters table data
   */
  alterTableData: function (sql) {
    return this.alterTable(sql) ||
           sql.search(/^refresh\s+materialized\s+view\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/^truncate\s+[\w\.\"]+/i) !== -1 ||
           sql.search(/insert\s+into/i) !== -1 ||
           sql.search(/update\s+[\w\.\-"]+\s+.*set/i) !== -1 ||
           sql.search(/delete\s+from/i) !== -1;
  }

};
