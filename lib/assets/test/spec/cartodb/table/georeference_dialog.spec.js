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
      model: model,
      geocoder: {setAddress:function(){}, start: function(){}}
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

  it("should georeference if we have filled address input", function() {
    TestUtil.feedTable(model, 1);
    view.render();

    spyOn(view.options.geocoder, 'setAddress');
    spyOn(view.options.geocoder, 'start');
    spyOn(view, "_hideError");

    view.option = 1;
    view.$el.find(".address input.column_autocomplete").val("New York");
    view._ok();

    expect(view._hideError).toHaveBeenCalled();
    expect(view.$el.find('.address input.column_autocomplete').val()).toEqual("New York");
    expect(view.options.geocoder.setAddress).toHaveBeenCalled();
    expect(view.options.geocoder.start).toHaveBeenCalled();
  });

  it("should not georeference if we have NOT filled address input", function() {
    TestUtil.feedTable(model, 1);
    view.render();

    spyOn(view.options.geocoder, 'setAddress');
    spyOn(view.options.geocoder, 'start');
    spyOn(view, "_showError");

    view.option = 1;
    view._ok();

    expect(view.$el.find('.address input.column_autocomplete').val()).toEqual("");
    expect(view._showError).toHaveBeenCalled();
    expect(view.options.geocoder.setAddress).not.toHaveBeenCalled();
    expect(view.options.geocoder.start).not.toHaveBeenCalled();
  });
});
