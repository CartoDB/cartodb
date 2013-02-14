describe("cdb.admin.LayerPanelView", function() { 

  var view;
  var map, table, sqlView, user, layer;
  beforeEach(function() {
    map = new cdb.admin.Map();
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
    table = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
    });
    user = new cdb.admin.User({
      username: 'testusername',
      api_key: 'rabos'
    });

    var globalError = new cdb.admin.GlobalError({
      el: $('<div>')
    });

    layer = new cdb.admin.CartoDBLayer();
    map.layers.add(layer);


    view = new cdb.admin.LayerPanelView({
      model: layer,
      map: map,
      user: user,
      table: table,
      sqlView: sqlView,
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
  
});
