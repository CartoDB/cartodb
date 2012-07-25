
describe("cartodb.models.Map", function() {

  var map;
  beforeEach(function() {
    map = new cdb.admin.Map();
  });

  it("should trigger change:dataLayer when datalayer changes", function() {
    var s = {
      changed: function() {}
    };
    spyOn(s, 'changed');
    map.bind('change:dataLayer', s.changed);
    map.addDataLayer(new cdb.geo.MapLayer());
    expect(s.changed).toHaveBeenCalled();
  });

  it("should trigger change:dataLayer when 2 layers are added", function() {
    var s = {
      changed: function() {}
    };
    spyOn(s, 'changed');
    map.bind('change:dataLayer', s.changed);
    map.layers.reset([
      new cdb.geo.MapLayer(),
      new cdb.geo.MapLayer()
    ]);
    expect(s.changed).toHaveBeenCalled();
  });

});
