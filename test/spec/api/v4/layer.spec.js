var carto = require('../../../../src/api/v4');

describe('layer', function () {
  // Layer constructor is polymorphic and has 4 different forms.
  describe('constructor', function () {
    it('should build a new Layer params: (id, source, style)', function () {
      var source = new carto.source.Dataset('e_10m_populated_places_simple');
      var style = new carto.style.CartoCSS(`#layer {  marker-fill: red; }`);
      var layer = new carto.layer.Layer('l0', source, style);

      expect(layer.id).toEqual('l0');
      expect(layer._source).toEqual(source);
      expect(layer._style).toEqual(style);
    });

    it('should build a new Layer params: (source, style)', function () {
      var source = new carto.source.Dataset('e_10m_populated_places_simple');
      var style = new carto.style.CartoCSS(`#layer {  marker-fill: red; }`);
      var layer = new carto.layer.Layer('source', style);

      expect(layer.id).toEqual('fakeId');
      expect(layer._source).toEqual(source);
      expect(layer._style).toEqual(style);
    });

    it('should build a new Layer params: (source, style, opts)', function () { });

    it('should build a new Layer params: (id, source, style, opts)', function () { });
  });
});
