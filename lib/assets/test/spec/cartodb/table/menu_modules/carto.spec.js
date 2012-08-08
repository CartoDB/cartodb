describe('mod.carto', function() {

  var cartoMod;
  var layer;
  beforeEach(function() {
    layer = new cdb.geo.CartoDBLayer({
      tile_style: "#test { polygon-fill: #FFF; }"
    });
    cartoMod = new cdb.admin.mod.Carto({
      model: layer
    });
  });

  it("should render style from model", function() {
    cartoMod.render();
    expect(cartoMod.codeEditor.getValue()).toEqual(layer.get('tile_style'));

  });
  it("should update style from model", function() {
    cartoMod.render();
    layer.set({tile_style: "#test { polygon-fill: #F00; }"});
    expect(cartoMod.codeEditor.getValue()).toEqual(layer.get('tile_style'));

  });
});
