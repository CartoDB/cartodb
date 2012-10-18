describe('mod.carto', function() {

  describe('panel', function() {
    var view;
    beforeEach(function() {
      var model = new cdb.geo.CartoDBLayer({
        tile_style: "#test { polygon-fill: #FFF; }"
      });
      var table = new cdb.admin.CartoDBTableMetadata({ name: 'test' });
      view = new cdb.admin.mod.Carto({
        el: $('<div>'),
        model: model,
        table: table
      });

      table.geomColumnTypes: function() {
        return 'polygon'
      } // HELLO HACK!
    });

    it("should enable wizard", function() {
      view.render();
      view.$('.wizard').trigger('click');
      expect(view.panels.activeTab).toEqual('wizard');
    });
    it("should enable editor", function() {
      view.render();
      view.$('.editor').trigger('click');
      expect(view.panels.activeTab).toEqual('editor');
    });
  });

  describe('editor', function() {
    var cartoMod;
    var layer;
    beforeEach(function() {
      layer = new cdb.geo.CartoDBLayer({
        tile_style: "#test { polygon-fill: #FFF; }"
      });
      cartoMod = new cdb.admin.mod.CartoEditor({
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

    it("should parse errors", function() {
      var errors = [
        'style.mss:11:2 Invalid code: asdasd',
        'style.mss:7:2 Invalid code: asdasdasda',
        'style.mss:7:2 Invalid code: asdasdasda'
      ];

      var errParsed = cartoMod._parseError(errors);
      expect(errParsed).toEqual([
        { line: 7, error: 'Invalid code: asdasdasda'},
        { line: 11, error: 'Invalid code: asdasd'}
      ]);



    });
  });

});
