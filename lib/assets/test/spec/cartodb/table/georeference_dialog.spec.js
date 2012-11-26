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

  it("should not let the user georeference if the table is empty", function() {
    view.render();
    expect(view.$('.ok').is('.disabled')).toBeTruthy;

  })

  it("should not render table columns in lat,lon selector if the table is empty", function() {
    view.render();
    expect(view.$('#lat').length).toEqual(0);
    expect(view.$('#lon').length).toEqual(0);
  });


  it("should render table columns in lat,lon selector if the table has contents", function() {
    TestUtil.feedTable(model, 1);
    view.render();
    expect(view.$('#lat option').length).toEqual(3);
    expect(view.$('#lon option').length).toEqual(3);
  });
});
