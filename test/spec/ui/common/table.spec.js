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

  describe("RowView", function() {
    it("should render in a row", function() {
      var row = new cdb.ui.common.Row({test0: 'a', test1: 'b'});
      var r = new cdb.ui.common.RowView({model: row});
      expect(r.render().$('td').length).toEqual(3); // two rows plus one blank row before them
    });

    it("should render in order", function() {
      var row = new cdb.ui.common.Row({test0: 'a', test1: 'b'});
      var r = new cdb.ui.common.RowView({model: row, order: ['test1', 'test0']});
      r.render();
      expect($(r.$('td')[1]).html()).toEqual('b');
      expect($(r.$('td')[2]).html()).toEqual('a');

      r = new cdb.ui.common.RowView({model: row, order: ['test0', 'test1']});
      r.render();
      expect($(r.$('td')[1]).html()).toEqual('a');
      expect($(r.$('td')[2]).html()).toEqual('b');
    });

    it("should render row header", function() {
      var row = new cdb.ui.common.Row({test0: 'a', test1: 'b'});
      var r = new cdb.ui.common.RowView({
        model: row,
        row_header: true
      });
      r.render();
      expect(r.$('td').length).toEqual(3);
    });

    it("should return cell x", function() {
      var row = new cdb.ui.common.Row({test0: 'a', test1: 'b'});
      var r = new cdb.ui.common.RowView({model: row});
      r.render();
      expect(r.getCell(2).html()).toEqual('b');
    });
  });

  describe("Table", function() {
    var table;
    beforeEach(function() {
      cdb.ui.common.Row.url = 'test';
      cols = new cdb.ui.common.TableData();
      cols.url = 'test';

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
      expect(table.render().$('th').length).toEqual(5);
      expect(table.render().$('td').length).toEqual(2*5);
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
      expect(table.rowViews.length).toEqual(1);
    });

    it("should add rows", function() {
      table.render();
      cols.add({'id': 4, 'col1': 1, 'col2': 2, 'col3': 3});
      expect(table.$('tr').length).toEqual(4);
    });

    it("should add rows at index", function() {
      table.render();
      cols.add({'id': 10, 'col1': 11, 'col2': 12, 'col3': 13}, {at: 1});
      expect(table.$('tr').length).toEqual(4);
      var cell = table.getCell(1, 1);
      expect(cell.html()).toEqual('10');
      expect(cell.parent().attr('data-y')).toEqual('1');
      expect(table.getCell(1, 2).parent().attr('data-y')).toEqual('2');
    });

    it("should update cell indexes when remove a column", function() {
      table.render();
      cols.add({'id': 10, 'col1': 11, 'col2': 12, 'col3': 13}, {at: 1});
      expect(table.$('tr').length).toEqual(4);
      cols.remove(cols.at(0));
      var cell = table.getCell(0, 1);
      expect(cell.parent().attr('data-y')).toEqual('1');
      /*
      var cell = table.getCell(0, 1);
      expect(cell.html()).toEqual('10');
      expect(cell.parent().attr('data-y')).toEqual('1');
      expect(table.getCell(0, 2).parent().attr('data-y')).toEqual('2');
      */
    });

    it("should remove rows", function() {
      table.render();
      cols.remove(cols.at(0));
      expect(table.$('tr').length).toEqual(2);
    });

    it("should return cell x,y", function() {
       //$('#foo').trigger('click');
      var cell = table.render().getCell(1, 1);
      expect(cell.html()).toEqual('2');
      cell = table.getCell(2, 1);
      expect(cell.html()).toEqual('4');
    });

    it("should trigger cell clicked on click and dblclick", function() {
      var cell = table.render().getCell(0, 1);
      spy = {
        click: function() {},
        dblClick: function() {}
      };
      spyOn(spy, 'click');
      spyOn(spy, 'dblClick');
      table.bind('cellClick', spy.click, spy);
      cell.trigger('click');
      expect(spy.click).toHaveBeenCalled();
      expect(spy.click.mostRecentCall.args[1][0]).toEqual(cell[0]);
      expect(spy.click.mostRecentCall.args[2]).toEqual(0);
      expect(spy.click.mostRecentCall.args[3]).toEqual(1);

      table.bind('cellDblClick', spy.dblClick, spy);
      cell.trigger('dblclick');
      expect(spy.dblClick).toHaveBeenCalled();
      expect(spy.dblClick.mostRecentCall.args[1][0]).toEqual(cell[0]);
      expect(spy.dblClick.mostRecentCall.args[2]).toEqual(0);
      expect(spy.dblClick.mostRecentCall.args[3]).toEqual(1);

    });

    it("should render new data on change data source", function() {
      cols = new cdb.ui.common.TableData();
      table.setDataSource(cols);
      cols.reset([
        {'id': 100, 'col1': 1, 'col2': 2, 'col3': 3}
      ]);
      cell = table.getCell(1, 0);
      expect(cell.html()).toEqual('100');
    });

    it("should clear rows after a reset", function() {
      expect(table.render().$('tr').length).toEqual(3);
      cols.reset([]);
      expect(table.$('tr').length).toEqual(1); // only the header
    });

    it("should call renderEmpty after an error", function() {
      spyOn(table, '_renderEmpty');
      cols.reset([], { silent: true });
      cols.trigger('error');
      expect(table._renderEmpty).toHaveBeenCalled();
    });


    it("should render faster than light", function() {
      var NCOLUMNS = 100;
      var NROWS = 260;
      var schema = []
      var rows = [];

      _(NCOLUMNS).times(function(n) {
        schema.push(['column_' + n, 'string']);
      });

      _(NROWS).times(function(n) {
        var row = {}
        _(schema).each(function(c) {
          row[c[0]] = "testestestest"
        })
        rows.push(row);
      });


      tableMetadata = new cdb.ui.common.TableProperties({
        schema: schema
      });
      cols.reset(rows);

      table = new cdb.ui.common.Table({
        dataModel: cols,
        model: tableMetadata
      });

      var mean = 0;
      var count = 5;
      for(var i = 0; i < count; ++i) {
        var t0 = new Date().getTime();
        table.render();
        var t1 = new Date().getTime();
        mean += t1 - t0;
      }
      expect(mean/count).toBeLessThan(1300);

    });

  });

});

