
describe("admin table", function() {

  describe("cbd.admin.Column", function() {
      var column;
      beforeEach(function() {
        var table = new cdb.admin.CartoDBTableMetadata({
          name: 'testTable'
        })
        column = new cdb.admin.Column({
          table: table,
          name: 'columnName'
        })
      });

      it("should have correct url", function() {
        expect(column.url()).toEqual(
          '/api/v1/tables/testTable/columns/columnName'
        )
      });
  });

  describe("cbd.admin.CartoDBTableMetadata", function() {
    var table;
    beforeEach(function() {
      table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number']
        ]
      })
    });

    it("should create column types", function() {
      expect(table._getColumn('test').get('type')).toEqual('string');
      expect(table._getColumn('test2').get('type')).toEqual('number');
      table.set({ schema:[
          ['test', 'number'],
          ['test2', 'number']
        ]
      });
      expect(table._getColumn('test').get('type')).toEqual('number');
    });


  });

  describe("cbd.admin.Tables", function() {
    var tables;

    beforeEach(function() {
      tables = new cdb.admin.Tables();
    });

    it("the model should be Table", function() {
      expect(tables.model).toEqual(cdb.admin.CartoDBTableMetadata);
    });
  });
});
