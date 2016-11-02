/**
 *  Checks properties from a SQL
 */

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

  prependTableName: function (sql, tableName, userName) {
    var replacement = '$1' + this.quoteIfNeeded(userName) + '.' + tableName;
    var pattern = '\\b([^.])' + tableName + '\\b';
    var search = new RegExp(pattern, 'gi');
    return sql.replace(search, replacement);
  },

  getUnqualifiedName: function (tablename) {
    if (!tablename) return null;
    var tk = tablename.split('.');
    if (tk.length === 2) {
      return tk[1];
    }
    return this.getUnquotedName(tablename);
  },

  getUnquotedName: function (tablename) {
    return tablename && tablename.replace(/"/g, '');
  },

  quoteIfNeeded: function (name) {
    var VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_$]*$/;
    name = this.getUnquotedName(name);
    if (!VALID_IDENTIFIER.test(name)) {
      name = '"' + name + '"';
    }
    return name;
  },

  getDefaultSQL: function (tableName, userName, inOrganization) {
    var schemaPrefix = inOrganization ? this.quoteIfNeeded(userName) + '.' : '';
    return 'SELECT * FROM ' + schemaPrefix + this.quoteIfNeeded(this.getUnqualifiedName(tableName));
  }
};
