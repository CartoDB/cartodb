var carto = require('../../../../src/api/v4');

describe('api/v4/layer', function () {
  // Layer constructor is polymorphic and has 4 different forms.
  describe('constructor', function () {
    var source;
    var style;

    beforeEach(function () {
      source = new carto.source.Dataset('e_10m_populated_places_simple');
      style = new carto.style.CartoCSS(`#layer {  marker-fill: red; }`);
    });

    it('should build a new Layer params: (source, style)', function () {
      var layer = new carto.layer.Layer(source, style);

      expect(layer.getSource()).toEqual(source);
      expect(layer.getStyle()).toEqual(style);
    });

    it('should assign a unique layer ID when not given one', function () {
      var layer1 = new carto.layer.Layer(source, style);
      var layer2 = new carto.layer.Layer(source, style);

      expect(typeof layer1.id === 'string').toBe(true);
      expect(typeof layer2.id === 'string').toBe(true);
      expect(layer1.id).not.toEqual(layer2.id);
    });

    it('should build a new Layer params: (source, style, options)', function () {
      var layer = new carto.layer.Layer(source, style, { id: 'myLayer' });

      expect(layer.id).toEqual('myLayer');
      expect(layer._source).toEqual(source);
      expect(layer._style).toEqual(style);
    });
  });
});
