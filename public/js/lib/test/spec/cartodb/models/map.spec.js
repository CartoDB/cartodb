
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
    map.addDataLayer(new cdb.admin.MapLayer());
    expect(s.changed).toHaveBeenCalled();
  });

  it("should trigger change:dataLayer when 2 layers are added", function() {
    var s = {
      changed: function() {}
    };
    spyOn(s, 'changed');
    map.bind('change:dataLayer', s.changed);
    map.layers.reset([
      new cdb.admin.MapLayer(),
      new cdb.admin.MapLayer()
    ]);
    expect(s.changed).toHaveBeenCalled();
  });

});
