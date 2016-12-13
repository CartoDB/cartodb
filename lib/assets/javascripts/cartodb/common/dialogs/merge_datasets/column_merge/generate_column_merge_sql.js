var _ = require('underscore-cdb-v3');

// Used for both left and right table
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
  var leftTableName = d.leftTableName;
  var leftColumnsNames = d.leftColumnsNames;
  var leftKeyColumnName = d.leftKeyColumnName;
  var leftKeyColumnType = d.leftKeyColumnType;

  var rightTableName = d.rightTableName;
  var rightColumnsNames = d.rightColumnsNames;
  var rightKeyColumnName = d.rightKeyColumnName;
  var rightKeyColumnType = d.rightKeyColumnType;

  // Add left table columns
  var sql = ['SELECT'];
  var selects = _.map(leftColumnsNames, function(columnName) {
    return selectColumn(leftTableName, rightTableName, columnName).join(' ');
  });

  // Add right table columns
  selects.push.apply(selects,
    _.map(rightColumnsNames, function(columnName) {
      var colSQL = selectColumn(rightTableName, leftTableName, columnName);

      var isColumnPresentInLeftTable = _.any(leftColumnsNames, function(leftColumnName) {
        return columnName === leftColumnName;
      });
      if (isColumnPresentInLeftTable) {
        colSQL = colSQL.concat('AS ' + rightTableName + '_' + columnName);
      }

      return colSQL.join(' ');
    })
  );

  // Make sure all select fields are comma separated
  sql.push(_.flatten(selects).join(', '));

  // LEFT JOIN
  sql.push('FROM ' + leftTableName + ' FULL OUTER JOIN ' + rightTableName + ' ON');

  // JOIN FIELD
  if (leftKeyColumnType === 'string' && rightKeyColumnType === 'string') {
    sql.push(
      'LOWER(TRIM(' + leftTableName + '.' + leftKeyColumnName + '))',
      '=',
      'LOWER(TRIM(' + rightTableName + '.' + rightKeyColumnName + '))'
    );
  } else {
    sql.push(
      leftTableName + '.' + leftKeyColumnName,
      '=',
      rightTableName + '.' + rightKeyColumnName
    );
  }

  return sql.join(' ');
};
