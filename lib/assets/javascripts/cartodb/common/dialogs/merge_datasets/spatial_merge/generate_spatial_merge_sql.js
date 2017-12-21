var _ = require('underscore-cdb-v3');

// SQL query as taken from old code, cdb.admin.MergeTablesDialog
// Cleaned up to remove noise and avoid string concatenation to be more legible.
module.exports = function(d) {
  var leftTableName = d.leftTableName;
  var leftColumnsNames = d.leftColumnsNames;
  var rightTableName = d.rightTableName;
  var selectClause = d.selectClause;
  var intersectType = d.intersectType;

  var sql = ['SELECT',
    leftTableName + '.cartodb_id,',
    leftTableName + '.the_geom_webmercator,',
    leftTableName + '.the_geom,'
  ];

  _.each(leftColumnsNames, function(columnName) {
    if (columnName !== 'the_geom') {
      sql.push(leftTableName + '.' + columnName + ',');
    }
  });

  sql.push(
    '(SELECT ' + selectClause + ' FROM ' + rightTableName,
      'WHERE ST_Intersects(' + leftTableName + '.the_geom, ' + rightTableName + '.the_geom)',
    ') AS intersect_' + intersectType,
    'FROM ' + leftTableName
  );

  return sql.join(' ');
};
