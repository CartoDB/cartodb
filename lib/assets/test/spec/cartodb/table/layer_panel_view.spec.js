describe("cdb.admin.LayerPanelView", function() { 

  var view;
  var map, table, sqlView, user, layer;
  beforeEach(function() {
    map = new cdb.admin.Map();

    user = new cdb.admin.User({
      username: 'testusername',
      api_key: 'rabos'
    });

    var globalError = new cdb.admin.GlobalError({
      el: $('<div>')
    });

    layer = new cdb.admin.CartoDBLayer({
      table_name: 'test'
    });

    table = layer.table;
    map.layers.add(layer);


    view = new cdb.admin.LayerPanelView({
      model: layer,
      map: map,
      user: user,
      globalError: globalError
    });
  });

  it("should add map_key in layer", function() {
    expect(layer.get('extra_params').map_key).toEqual('rabos');
  });

  it("should hide/show the layer", function() {
    view.hide();
    expect(view.$('.sidebar').css('display')).toEqual('none');
    expect(view.$('.views').css('display')).toEqual('none');

    view.show();
    expect(view.$('.sidebar').css('display')).toEqual('block');
    expect(view.$('.views').css('display')).toEqual('block');
  });


  describe("buttons behavior", function() {

    it("should show all the buttons when no sql is applied", function() {
      view.setActiveWorkView('table');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(4);

      view.setActiveWorkView('map');
      var e = _(view.enabledButtonsForSection('map')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(4);
    });

    it("should show readonly buttons when sql is applied", function() {
      table.useSQLView(view.sqlView);
      view.setActiveWorkView('table');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(1);

      view.setActiveWorkView('map');
      var e = _(view.enabledButtonsForSection('map')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(4);
    });

    it("should show change to readonly buttons when sql is applied", function() {
      view.setActiveWorkView('table');
      table.useSQLView(view.sqlView);
      view.sqlView.modify_rows = false;
      view.sqlView.trigger('reset');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(1);
    });

  });
  
});
