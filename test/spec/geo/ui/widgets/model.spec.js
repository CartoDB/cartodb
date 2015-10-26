describe('widgets/model', function() {

  beforeEach(function() {
    this.model = new cdb.geo.ui.Widget.Model();
  });

  it('should listen to a dashboardBaseURL attribute change', function() {
    spyOn(this.model, 'bind').and.callThrough();
    this.model._initBinds();  // _initBinds is called when object is created, so
                              // it is necessary to called again to have the spy
                              // correctly set.
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:dashboardBaseURL');
  });

  it('should trigger loading event when fetch is launched', function() {
    spyOn(this.model, 'trigger');
    this.model.fetch();
    expect(this.model.trigger).toHaveBeenCalledWith('loading', this.model);
  });

});
