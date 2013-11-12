
describe('BackgroundGeocoder', function() {
  var view, model;
  beforeEach(function() {
    model = new cdb.admin.Geocoding();
    view = new cdb.admin.BackgroundGeocoder({ model: model, template_base: 'table/views/geocoder_progress' });
  });

  it("should render empty", function() {
    model.unset('id')
    view.render();
    expect(view.$el.html()).toBe('');
  });

  it("should render the progress", function() {
    model.set({
      id: 2,
      state: null,
      formatter: 'address',
      table: 'test'
    });
    view.render();
    expect(view.$el.html()).not.toBe('');
  });

  it("should hide when progress has finished", function() {
    view.bindGeocoder();

    model.set({
      id: 2,
      state: null,
      formatter: 'address',
      table: 'test'
    });
    view.render();
    model.set('state', 'finished')
    expect(view.started).toBeFalsy();
  });

  it("should cancel geocoding procress", function() {
    spyOn(model, 'cancelGeocoding');
    model.set({
      id: 2,
      state: null,
      formatter: 'address',
      table: 'test'
    });
    view.render();
    
    view.$('a.cancel').click();
    expect(model.cancelGeocoding).toHaveBeenCalled();
  });

  it("should hide when geocoder has failed", function() {
    view.bindGeocoder();
    view.render();

    model.set({
      id: 1,
      state: null,
      formatter: 'address',
      table: 'test'
    });

    model.trigger('geocodingError');
    expect(view.started).toBeFalsy();
  });
});
