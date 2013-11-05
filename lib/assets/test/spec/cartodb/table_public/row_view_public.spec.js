describe("PublicRowView", function() {

  var tableview, view, model;
  beforeEach(function() {
    model = new cdb.open.PublicCartoDBTableMetadata({
      name: 'test',
      schema: [ ['test', 'string'], ['test2', 'number']]
    });

    view = new cdb.open.PublicRowView({
      el: $('<div>'),
      model: new cdb.admin.Row(),
      row_header: true
    });

    tableview = new cdb.admin.TableView({
      model: model,
      geocoder: new cdb.admin.Geocodings(),
      dataModel: model.data()
    });

    view.tableView = tableview;
  });

  it("should not open row menu on click", function() {
    view.render();
    view.$('.row_header').trigger('click');
    expect(view._getRowOptions()).toBeFalsy();
  });

});
