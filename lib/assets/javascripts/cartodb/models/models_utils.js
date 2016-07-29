(function() {
  cdb.utils = cdb.utils || {}

  // This method is duplicated from lib/assets/javascripts/cartodb3/helpers/utils.js so it can be used in older models
  cdb.utils.safeTableNameQuoting = function(table_name) {
    if(table_name === undefined || table_name.indexOf('-') == -1 || table_name[0] == '"' || table_name[table_name.length - 1] == '"') {
      return table_name;
    } else {
      return '"' + table_name + '"';
    }
  }
})();
