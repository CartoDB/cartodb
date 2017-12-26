var generateColumnMergeSQL = require('../../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/column_merge/generate_column_merge_sql');

describe('common/dialog/merge_datasets/column_merge/generate_column_merge_sql', function() {
  describe('when given two matching key column types', function() {
    beforeEach(function() {
      this.data = {
        "leftTableName": "a",
        "leftKeyColumnName": "name",
        "leftKeyColumnType": "string",
        "leftColumnsNames": [
          "area",
          "name"
        ],
        "rightTableName": "b",
        "rightKeyColumnName": "name",
        "rightKeyColumnType": "string",
        "rightColumnsNames": [
          "the_geom",
          "adm0_a3",
          "name"
        ]
      };
      this.sql = generateColumnMergeSQL(this.data);
    });

    it('should return a valid SQL that rights the two tables', function() {
      expect(this.sql).toEqual('SELECT a.area, a.name, CASE WHEN b.the_geom IS NULL THEN a.the_geom ELSE b.the_geom END AS the_geom, b.adm0_a3, b.name AS b_name FROM a FULL OUTER JOIN b ON LOWER(TRIM(a.name)) = LOWER(TRIM(b.name))');
    });
  });

  describe('when given two none-matching key column types', function() {
    beforeEach(function() {
      this.data = {
        "leftTableName": "a",
        "leftKeyColumnName": "name",
        "leftKeyColumnType": "string",
        "leftColumnsNames": [
          "the_geom",
          "area",
          "name"
        ],
        "rightTableName": "b",
        "rightKeyColumnName": "name",
        "rightKeyColumnType": "number",
        "rightColumnsNames": [
          "adm0_a3",
          "name"
        ]
      };
      this.sql = generateColumnMergeSQL(this.data);
    });

    it('should return a valid SQL that merges the two tables', function() {
      expect(this.sql).toEqual('SELECT CASE WHEN a.the_geom IS NULL THEN b.the_geom ELSE a.the_geom END AS the_geom, a.area, a.name, b.adm0_a3, b.name AS b_name FROM a FULL OUTER JOIN b ON a.name = b.name');
    });
  });
});
