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
    var schemaPrefix = userName ? (inOrganization ? this._quoteIfNeeded(userName) + '.' : 'public.') : '';
    return schemaPrefix + this._quoteIfNeeded(this.getUnqualifiedName(tableName));
  },

  isSameTableName: function (firstTableName, secondTableName, ownerUsername) {
    var firstParts = this._getTableNameParts(firstTableName, ownerUsername);
    var secondParts = this._getTableNameParts(secondTableName, ownerUsername);

    return firstParts[0] === secondParts[0] && firstParts[1] === secondParts[1];
  },

  _getTableNameParts: function (tableName, ownerUsername) {
    var table = this.getUnqualifiedName(tableName);
    var username = this.getUsername(tableName) || ownerUsername;

    return [username, table];
  }
};
