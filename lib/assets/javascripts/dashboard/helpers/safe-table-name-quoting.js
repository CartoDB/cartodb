/*
* Returns a (double) quoted table name if needed (if it contains a dash, for example).
* Coupled to backend lib/carto/table_utils.rb#safe_table_name_quoting.
* Duplicated at lib/assets/javascripts/builder/helpers/utils.js to make it available for older models.
*/
module.exports = function (table_name) {
  if (table_name === undefined || table_name.indexOf('-') === -1 || table_name[0] === '"' || table_name[table_name.length - 1] === '"') {
    return table_name;
  } else {
    return '"' + table_name + '"';
  }
};
