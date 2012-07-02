
describe("admin table", function() {
  describe("cbd.admin.Table", function() {
    var table;
    beforeEach(function() {
      table = new cbd.admin.Table();
    });
  });

  describe("cbd.admin.Tables", function() {
    var tables;

    beforeEach(function() {
      tables = new cdb.admin.Tables();
    });

    it("the model should be Table", function() {
      expect(tables.model).toEqual(cdb.admin.Table);
    });
  });
});
