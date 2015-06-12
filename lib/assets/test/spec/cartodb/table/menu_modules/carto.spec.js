describe('mod.carto', function() {

  describe('editor', function() {
    var cartoMod;
    var layer;
    beforeEach(function() {
      layer = new cdb.admin.CartoDBLayer({
        tile_style: "#test { polygon-fill: #FFF; }\n"
      });
      cartoMod = new cdb.admin.mod.CartoCSSEditor({
        model: layer
      });
    });

    it("should render style from model", function() {
      cartoMod.render();
      expect(cartoMod.codeEditor.getValue()).toEqual(layer.get('tile_style'));

    });
    it("should update style from model", function() {
      cartoMod.render();
      layer.set({tile_style: "#test { polygon-fill: #F00; }\n"});
      expect(cartoMod.codeEditor.getValue()).toEqual(layer.get('tile_style'));

    });

    it("should send Map rules as well", function(){
      var l = new cdb.admin.CartoDBLayer({
        tile_style: "Map{ buffer-size: 30; }\n"
      });
      var c = new cdb.admin.mod.CartoCSSEditor({
        model: l
      });
      c.render();
      expect(c.model.wizard_properties.layer.attributes.tile_style.indexOf("buffer-size: 30;") > -1);
    });

    it("should parse errors", function() {
      var errors = [
        'style.mss:11:2 Invalid code: asdasd',
        'style.mss:7:2 Invalid code: asdasdasda',
        'style.mss:7:2 Invalid code: asdasdasda',
        'blablabla balball balbla'
      ];

      var errParsed = cartoMod._parseError(errors);
      expect(errParsed).toEqual([
        { line: null, message: 'blablabla balball balbla' },
        { line: 7, message: 'Invalid code: asdasdasda'},
        { line: 11, message: 'Invalid code: asdasd'},
      ]);
    });

    it("should detect when the cartocss hasn't changed", function() {
      cartoMod.render();
      layer.set({tile_style: "#test { polygon-fill: #F00; }\n"});
      expect(cartoMod.hasChanges()).toBeFalsy();
    })

    it("should detect when the cartocss has changed", function() {
      cartoMod.render();
      layer.set({tile_style: "#test { polygon-fill: #F00; }\n"});
      cartoMod.codeEditor.setValue('php sux')
      expect(cartoMod.hasChanges()).toBeTruthy();
    })

    it("should not save style if there are errors", function() {
      cartoMod.render();
      cartoMod.codeEditor.setValue("#test { polygon-fill: #FFF; asdas; asdasdasd; }\n");
      spyOn(layer, 'save');
      spyOn(cartoMod, '_adjustCodeEditorSize');
      cartoMod.applyStyle();
      expect(cartoMod._adjustCodeEditorSize).toHaveBeenCalled();
      expect(layer.save).not.toHaveBeenCalled();
    });

    it("should save style if there no are errors", function() {
      cartoMod.render();
      cartoMod.codeEditor.setValue("#test { polygon-fill: #FFF; }\n");
      spyOn(layer, 'save');
      cartoMod.applyStyle();
      expect(layer.save).toHaveBeenCalled();
    });

    it("should set tile_style_custom to true", function() {
      var style;
      cartoMod.render();
      cartoMod.codeEditor.setValue(style="#test { polygon-fill: #FFF; }\n");
      spyOn(layer, 'save');
      cartoMod.applyStyle();
      expect(layer.save).toHaveBeenCalledWith({
        tile_style: style,
        tile_style_custom: true
      });
    });

  });

});
