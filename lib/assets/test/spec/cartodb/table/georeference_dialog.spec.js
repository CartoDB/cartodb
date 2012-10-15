describe("georeference dialog", function() {

  var view, model;
  beforeEach(function() {
    model = new cdb.admin.CartoDBTableMetadata({
      name: 'test',
      schema: [ 
        ['cartodb_id', 'number'],
        ['c1', 'number'],
        ['c2', 'number'],
        ['c3', 'number']
      ]
    });
    view = new cdb.admin.GeoreferenceDialog({
      model: model
    });
  });

  it("should render table columns in lat,lon selector", function() {
    view.render();
    expect(view.$('#lat option').length).toEqual(3);
    expect(view.$('#lon option').length).toEqual(3);
  });
});
