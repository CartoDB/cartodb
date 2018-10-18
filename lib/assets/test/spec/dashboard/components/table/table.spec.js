const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const RowModel = require('dashboard/data/table/row-model');
const CartoTableData = require('dashboard/data/table/carto-table-data.js');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const Table = require('dashboard/components/table/table');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/components/table/table', function () {
  let table, cols, tableMetadata;

  beforeEach(function () {
    RowModel.url = 'test';
    cols = new CartoTableData([], { configModel });
    cols.url = 'test';

    tableMetadata = new CartoTableMetadata({
      schema: [
        ['id', 'number'],
        ['col1', 'number'],
        ['col2', 'number'],
        ['col3', 'number']
      ]
    }, { configModel });

    cols.reset([
      new Backbone.Model({'id': 1, 'col1': 1, 'col2': 2, 'col3': 3}),
      new Backbone.Model({'id': 2, 'col1': 4, 'col2': 5, 'col3': 6})
    ]);

    cols.fetched = true;

    table = new Table({
      dataModel: cols,
      model: tableMetadata
    });

    cols.table = table;
  });

  it('should render a table', function () {
    expect(table.render().$el.is('table')).toEqual(true);
  });

  it('should render a header', function () {
    expect(table.render().$('thead')).toBeTruthy();
  });

  it('should have 2 rows and the header', function () {
    expect(table.render().$('tr').length).toEqual(3);
  });

  it('should have 6 cells and header', function () {
    expect(table.render().$('th').length).toEqual(5);
    expect(table.render().$('td').length).toEqual(2 * 5);
  });

  it('each row has an id', function () {
    expect($(table.render().$('tr')[1]).attr('id')).toEqual('row_' + cols.at(0).id);
  });

  it('should change value when model changes', function () {
    table.render();
    cols.at(0).set('col1', 10);
    expect(table.$('#cell_1_col1').html()).toEqual(cols.at(0).get('col1').toString());
  });

  it('should rerender on data reset', function () {
    expect(table.render().$('tr').length).toEqual(3);
    cols.reset([
      {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3}
    ]);
    expect(table.$('tr').length).toEqual(2);
  });

  it('should remove rows on remove', function () {
    table.render();
    cols.at(0).destroy();
    expect(table.$('tr').length).toEqual(2);
    expect(table.rowViews.length).toEqual(1);
  });

  it('should add rows', function () {
    table.render();
    cols.add({'id': 4, 'col1': 1, 'col2': 2, 'col3': 3});
    expect(table.$('tr').length).toEqual(4);
  });

  it('should add rows at index', function () {
    table.render();
    cols.add({'id': 10, 'col1': 11, 'col2': 12, 'col3': 13}, {at: 1});
    expect(table.$('tr').length).toEqual(4);
    var cell = table.getCell(1, 1);
    expect(cell.html()).toEqual('10');
    expect(cell.parent().attr('data-y')).toEqual('1');
    expect(table.getCell(1, 2).parent().attr('data-y')).toEqual('2');
  });

  it('should update cell indexes when remove a column', function () {
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

  it('should remove rows', function () {
    table.render();
    cols.remove(cols.at(0));
    expect(table.$('tr').length).toEqual(2);
  });

  it('should return cell x,y', function () {
    // $('#foo').trigger('click');
    var cell = table.render().getCell(1, 1);
    expect(cell.html()).toEqual('2');
    cell = table.getCell(2, 1);
    expect(cell.html()).toEqual('4');
  });

  it('should trigger cell clicked on click and dblclick', function () {
    var cell = table.render().getCell(0, 1);
    const spy = {
      click: function () {},
      dblClick: function () {}
    };
    spyOn(spy, 'click');
    spyOn(spy, 'dblClick');
    table.bind('cellClick', spy.click, spy);
    cell.trigger('click');
    expect(spy.click).toHaveBeenCalled();
    expect(spy.click.calls.mostRecent().args[1][0]).toEqual(cell[0]);
    expect(spy.click.calls.mostRecent().args[2]).toEqual(0);
    expect(spy.click.calls.mostRecent().args[3]).toEqual(1);

    table.bind('cellDblClick', spy.dblClick, spy);
    cell.trigger('dblclick');
    expect(spy.dblClick).toHaveBeenCalled();
    expect(spy.dblClick.calls.mostRecent().args[1][0]).toEqual(cell[0]);
    expect(spy.dblClick.calls.mostRecent().args[2]).toEqual(0);
    expect(spy.dblClick.calls.mostRecent().args[3]).toEqual(1);
  });

  xit('should render new data on change data source', function () {
    // TODO: This test fails because resetting the collection sets the
    // status to unfetched, and table doesn't re-render rows.
    cols = new CartoTableData({}, { configModel });

    table.setDataSource(cols);

    cols.reset([
      new Backbone.Model({ 'id': 100, 'col1': 1, 'col2': 2, 'col3': 3 })
    ], { fetched: true });

    const cell = table.getCell(1, 0);
    expect(cell.html()).toEqual('100');
  });

  it('should clear rows after a reset', function () {
    expect(table.render().$('tr').length).toEqual(3);
    cols.reset([]);
    expect(table.$('tr').length).toEqual(1); // only the header
  });

  it('should call renderEmpty after an error', function () {
    spyOn(table, '_renderEmpty');
    cols.reset([], { silent: true });
    cols.trigger('error');
    expect(table._renderEmpty).toHaveBeenCalled();
  });

  it('should render faster than light', function () {
    var NCOLUMNS = 100;
    var NROWS = 260;
    var schema = [];
    var rows = [];

    _(NCOLUMNS).times(function (n) {
      schema.push(['column_' + n, 'string']);
    });

    _(NROWS).times(function (n) {
      var row = {};
      _(schema).each(function (c) {
        row[c[0]] = 'testestestest';
      });
      rows.push(row);
    });

    tableMetadata = new CartoTableMetadata({ schema }, { configModel });
    cols.reset(rows);

    table = new Table({
      dataModel: cols,
      model: tableMetadata
    });

    var mean = 0;
    var count = 5;
    for (var i = 0; i < count; ++i) {
      var t0 = new Date().getTime();
      table.render();
      var t1 = new Date().getTime();
      mean += t1 - t0;
    }
    // God please, forgive me.
    expect(mean / count).toBeLessThan(10000);
  });
});
