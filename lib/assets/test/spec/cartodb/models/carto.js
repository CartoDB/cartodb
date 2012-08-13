
describe("cbd.admin.CartoStyles", function() {

  describe("simple polygon generation", function() {
    it("should return valid css", function() {
      var css = simple_polygon_generator('test_table', {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'line-width': 1,
        'polygon-opacity': 0.7,
        'line-opacity':1
      });

      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('polygon-fill: #FF6600;') != -1).toEqual(true);
      expect(css.indexOf('line-opacity: 1;') != -1).toEqual(true);
    });

  });

  describe("cdb.admin.CartoStyles", function() {
    var model, table;

    beforeEach(function() {
      table = new cdb.admin.CartoDBTableMetadata({ nane: 'test' });
      model = new cdb.admin.CartoStyles({ table: table });
    });

    it("should generate carto style when table name changes", function() {
      var s = sinon.spy();
      model.bind('change:style', s);
      table.set({name: 'test2'});
      expect(s.called).toEqual(true);
    });

    it("should generate carto style when properties changes", function() {
      var s = sinon.spy();
      model.bind('change:style', s);
      model.set({ properties: { 'polygon-fill': '#FFF' }});
      expect(s.called).toEqual(true);
    });

  });
});
