describe("PublicRowView", function() {

  var tableview, view, model;
  beforeEach(function() {
    model = new cdb.open.PublicCartoDBTableMetadata({
      name: 'test',
      schema: [ ['cartodb_id', 'number'], ['test', 'string'], ['test2', 'number'], ['the_geom', 'geometry']],
      geometry_types: ['ST_MultiPoint']
    });

    view = new cdb.open.PublicRowView({
      el: $('<div>'),
      model: new cdb.admin.Row({ cartodb_id: 1, test: 'test', test2: 1, the_geom: '{ "type": "Point", "coordinates": [100.0, 0.0] }' }),
      row_header: true
    });

    tableview = new cdb.open.PublicTableView({
      model: model,
      geocoder: new cdb.admin.Geocodings(),
      dataModel: model.data()
    });

    view.tableView = tableview;
  });

  it("should render properly", function() {
    view.render();
    expect(view.$('td').length).toBe(5);

    expect(view.$('td:eq(0) div.cell').text()).toBe('');
    expect(view.$('td:eq(1) div.cell').text()).toBe('1');
    expect(view.$('td:eq(2) div.cell').text()).toBe('test');
    expect(view.$('td:eq(3) div.cell').text()).toBe('1');
    expect(view.$('td:eq(4) div.cell').text()).toBe('GeoJSON');
  });

  it("should not open row menu on click", function() {
    view.render();
    view.$('.row_header').trigger('click');
    expect(view._getRowOptions()).toBeFalsy();
  });

});
