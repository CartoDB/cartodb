/**
 *  Checks properties from a SQL
 */

var TableNameUtils = require('./table-name-utils');

module.exports = {
  isSameQuery: function (originalQuery, customQuery) {
    if (originalQuery == null || customQuery == null) { // eslint-disable-line
      throw new Error('Needed parameters not provided');
    }

    var parseQuery = function (query) {
      return query
        .toLowerCase()
        .replace(/\"/g, '') // Remove quoted things like "pepe".tableName
        .replace(/;/g, '');
    };

    return parseQuery(originalQuery) === parseQuery(customQuery);
  },

  // return true if the sql query alters table schema in some way
  altersSchema: function (sql) {
    if (!sql) {
      return false;
    }

    // Remove all line breaks in order to prevent
    // search pattern problems
    sql = this._removeLineBreaks(sql.trim());

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

  // return true if the sql query alters table data
  altersData: function (sql) {
    if (!sql) {
      return false;
    }

    // Remove all line breaks in order to prevent
    // search pattern problems
    sql = this._removeLineBreaks(sql.trim());

    return this.altersSchema(sql) ||
      sql.search(/^refresh\s+materialized\s+view\s+[\w\.\"]+/i) !== -1 ||
      sql.search(/^truncate\s+[\w\.\"]+/i) !== -1 ||
      sql.search(/insert\s+into/i) !== -1 ||
      sql.search(/update\s+[\w\.\-"]+\s+.*set/i) !== -1 ||
      sql.search(/delete\s+from/i) !== -1;
  },

  _removeLineBreaks: function (sql) {
    return sql.replace(/\r?\n|\r/g, ' ');
  },

  getDefaultSQL: function (tableName, userName, inOrganization) {
    return this.getDefaultSQLFromTableName(TableNameUtils.getQualifiedTableName(tableName, userName, inOrganization));
  },

  getDefaultSQLFromTableName: function (tableName) {
    return 'SELECT * FROM ' + tableName;
  }
};
