/**
 *  Functions to work with SQL table names
 */

module.exports = {
  getUnqualifiedName: function (tablename) {
    if (!tablename) return null;
    var tk = tablename.split('.');
    if (tk.length === 2) {
      return this._getUnquotedName(tk[1]);
    }
    return this._getUnquotedName(tablename);
  },

  getUsername: function (tablename) {
    if (!tablename) return null;
    var tk = tablename.split('.');
    if (tk.length === 2) {
      return this._getUnquotedName(tk[0]);
    }
    return '';
  },

  _getUnquotedName: function (tablename) {
    return tablename && tablename.replace(/"/g, '');
  },

  _quoteIfNeeded: function (name) {
    var VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_$]*$/;
    name = this._getUnquotedName(name);
    if (!VALID_IDENTIFIER.test(name)) {
      name = '"' + name + '"';
    }
    return name;
  },

  getQualifiedTableName: function (tableName, userName, inOrganization) {
    var schemaPrefix = (inOrganization && userName) ? this._quoteIfNeeded(userName) + '.' : '';
    return schemaPrefix + this._quoteIfNeeded(this.getUnqualifiedName(tableName));
  }
};
