var Dataset = require('./dataset');
var SQL = require('./sql');

module.exports = function NodeNamespaceConstructor (engine) {
  return {
    Dataset: function (id, name) {
      return new Dataset(id, name, engine);
    },
    SQL: function (id, query) {
      return new SQL(id, query, engine);
    }
  };
};
