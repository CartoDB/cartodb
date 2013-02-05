describe("cdb.admin.LayersPanel", function() {

  var view;
  var map, table, sqlView, user;

  beforeEach(function() {
    map = new cdb.admin.Map();
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
    table = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
    });
    user = new cdb.admin.User();

    var globalError = new cdb.admin.GlobalError({
      el: $('<div>')
    });

    map.layers.add(new cdb.geo.MapLayer());
    map.layers.add(new cdb.admin.CartoDBLayer());
    map.layers.add(new cdb.admin.CartoDBLayer());

    view = new cdb.admin.LayersPanel({
      table: table,
      map: map,
      user: user,
      globalError: globalError
    });
    
  });

  it("should render a layer panel for each layer in the map", function() {
    view.render();
    expect(_.keys(view.tabs).length).toEqual(2);
  });

  it("should add a layer panel when layers is added to the map", function() {
    view.render();
    map.layers.add(new cdb.admin.CartoDBLayer());
    expect(_.keys(view.tabs).length).toEqual(3);
  });

  it("should add a layers panels when on reset layers", function() {
    view.render();
    map.layers.reset([
      new cdb.admin.CartoDBLayer(),
      new cdb.admin.CartoDBLayer()
    ]);
    expect(_.keys(view.tabs).length).toEqual(2);
  });

  it("should show", function() {
    spyOn(view.$el, 'animate');
    view.render().show('table');
    expect(view.$el.animate).toHaveBeenCalled();
    expect(view.isOpen).toEqual(true);
    //expect(view.panels.activeTab).toEqual('table');
  });

  it("should hide", function() {
    spyOn(view.$el, 'animate');
    view.render().hide();
    expect(view.$el.animate).toHaveBeenCalled();
    expect(view.isOpen).toEqual(false);
  });

  it("should show tools", function() {
    view.render();
    var p = view.getActivePane()
    spyOn(p, 'showTools')
    view.showTools('table');
    expect(p.showTools).toHaveBeenCalledWith('table');
  });




});
