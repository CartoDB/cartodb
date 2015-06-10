var _ = require('underscore');

// Used for both actual and merge table
var selectColumn = function(tableName, otherTableName, columnName) {
  if (columnName === 'the_geom') {
    return [
      'CASE WHEN ' + tableName + '.' + columnName + ' IS NULL THEN',
      otherTableName + '.' + columnName,
      'ELSE',
      tableName + '.' + columnName,
      'END AS',
        columnName
    ];
  } else {
    return [ tableName + '.' + columnName ];
  }
};

// SQL query as taken from old code, cdb.admin.MergeTablesDialog
// Cleaned up to remove noise and avoid string concatenation to be more legible.
module.exports = function(d) {
  var sql = ['SELECT'];

  var actualTableName = d.actualTableName;
  var actualColumnsNames = d.actualColumnsNames;
  var actualKeyColumnName = d.actualKeyColumnName;
  var actualKeyColumnType = d.actualKeyColumnType;

  var mergeTableName = d.mergeTableName;
  var mergeColumnsNames = d.mergeColumnsNames;
  var mergeKeyColumnName = d.mergeKeyColumnName;
  var mergeKeyColumnType = d.mergeKeyColumnType;

  // Add actual table columns
  sql = sql.concat(
    _.chain(actualColumnsNames)
    .map(function(columnName) {
      return selectColumn(actualTableName, mergeTableName, columnName);
    })
    .value()
    .join(', ')
  );

  // Add merge table columns
  sql = sql.concat(
    _.chain(mergeColumnsNames)
    .map(function(columnName) {
      var colSQL = selectColumn(mergeTableName, actualTableName, columnName);

      var isColumnPresentInActualTable = _.any(actualColumnsNames, function(actualColumnName) {
        return columnName === actualColumnName;
      });
      if (isColumnPresentInActualTable) {
        colSQL = colSQL.concat('AS ' + mergeTableName + '_' + columnName);
      }

      return colSQL.join(' ');
    })
    .value()
    .join(', ')
  );

  // LEFT JOIN
  sql.push('FROM ' + actualTableName + ' FULL OUTER JOIN ' + mergeTableName + ' ON');

  // JOIN FIELD
  if (actualKeyColumnType === 'string' && mergeKeyColumnType === 'string') {
    sql = sql.concat([
      'LOWER(TRIM(' + actualTableName + '.' + actualKeyColumnName + '))',
      '=',
      'LOWER(TRIM(' + mergeTableName + '.' + mergeKeyColumnName + '))'
    ]);
  } else {
    sql = sql.concat([
      actualTableName + '.' + actualKeyColumnName,
      '=',
      mergeTableName + '.' + mergeKeyColumnName
    ]);
  }

  return sql.join(' ');
};
