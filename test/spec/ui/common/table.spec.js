describe("common.ui.Table", function() {

  var cols; 
  var tableMetadata;
  describe("Row", function() {
    beforeEach(function() {
    });

    it("", function() {

    });
  });

  describe("TableData", function() {
    beforeEach(function() {
      cols = new cdb.ui.common.TableData();
      cols.reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3},
        {'id': 2, 'col1': 4, 'col2': 5, 'col3': 6}
      ]);
    });
    it("should return the value for cell", function() {
      expect(cols.getCell(0, 'col1')).toEqual(1);
    });

    it("should return null for non existing cell", function() {
      expect(cols.getCell(10, 'col1')).toEqual(null);
    });
  });

  describe("Table", function() {
    var table;
    beforeEach(function() {
      cdb.ui.common.Row.url = 'test';
      cols = new cdb.ui.common.TableData();

      tableMetadata = new cdb.ui.common.TableProperties({
        schema: [
          ['id', 'number'],
          ['col1','number'], 
          ['col2','number'], 
          ['col3','number']
        ]
      });
      cols.reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3},
        {'id': 2, 'col1': 4, 'col2': 5, 'col3': 6}
      ]);

      table = new cdb.ui.common.Table({
        dataModel: cols,
        model: tableMetadata
      });

      this.server = sinon.fakeServer.create();


    });

    it("should render a table", function() {
      expect(table.render().$el.is('table')).toEqual(true);
    });

    it("should render a header", function() {
      expect(table.render().$('thead')).toBeTruthy();
    });

    it("should have 2 rows and the header", function() {
      expect(table.render().$('tr').length).toEqual(3);
    });

    it("should have 6 cells and header", function() {
      expect(table.render().$('td').length).toEqual(3*4);
    });

    it("each row has an id", function() {
      expect($(table.render().$('tr')[1]).attr('id')).toEqual('row_' + cols.at(0).id);
    });

    it("should change value when model changes", function() {
      table.render();
      cols.at(0).set('col1', 10);
      expect(table.$('#cell_1_col1').html()).toEqual(cols.at(0).get('col1').toString());
    });

    it("should rerender on data reset", function() {
      expect(table.render().$('tr').length).toEqual(3);
      cols.reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3}
      ]);
      expect(table.$('tr').length).toEqual(2);
    });

    it("should remove rows on remove", function() {
      table.render();
      cols.at(0).destroy();
      expect(table.$('tr').length).toEqual(2);
    });

    it("should add rows", function() {
      table.render();
      cols.add({'id': 4, 'col1': 1, 'col2': 2, 'col3': 3});
      expect(table.$('tr').length).toEqual(4);
    });

  });

});

