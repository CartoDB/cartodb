describe("RowView", function() {

  var tableview, view, model;
  beforeEach(function() {
    model = new cdb.admin.CartoDBTableMetadata({
      name: 'test',
      schema: [ ['test', 'string'], ['test2', 'number']]
    });

    view = new cdb.admin.RowView({
      el: $('<div>'),
      model: new cdb.admin.Row(),
      row_header: true
    });

    tableview = new cdb.admin.TableView({
      model: model,
      dataModel: model.data()
    });

    view.tableView = tableview;
    view._getRowOptions().$el.css('display', 'none');
  });

  it("should open row menu", function() {
    view.render();
    view.$('.row_header').trigger('click');
    expect(view._getRowOptions().$el.css('display')).toEqual('block');
  });

  it("should not open row menu in read only mode ", function() {
    var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
    model.useSQLView(sqlView);
    view.render();
    view.$('.row_header').trigger('click');
    expect(view._getRowOptions().$el.css('display')).not.toEqual('block');
  });

});
