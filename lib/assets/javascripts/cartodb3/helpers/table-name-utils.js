/**
 *  Functions to work with SQL table names
 */

module.exports = {
  getUnqualifiedName: function (tablename) {
    if (!tablename) return null;
    var tk = tablename.split('.');
    if (tk.length === 2) {
      return this.getUnquotedName(tk[1]);
    }
    return this.getUnquotedName(tablename);
  },

  getUsername: function (tablename) {
    if (!tablename) return null;
    var tk = tablename.split('.');
    if (tk.length === 2) {
      return this.getUnquotedName(tk[0]);
    }
    return '';
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

  getQualifiedTableName: function (tableName, userName, inOrganization) {
    var schemaPrefix = (inOrganization && userName) ? this.quoteIfNeeded(userName) + '.' : '';
    return schemaPrefix + this.quoteIfNeeded(this.getUnqualifiedName(tableName));
  }
};
