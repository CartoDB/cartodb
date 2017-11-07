var carto = require('../../../../src/api/v4');

describe('api/v4/layer', function () {
  var source;
  var style;

  beforeEach(function () {
    source = new carto.source.Dataset('ne_10m_populated_places_simple');
    style = new carto.style.CartoCSS(`#layer {  marker-fill: red; }`);
  });

  describe('constructor', function () {
    it('should build a new Layer params: (source, style)', function () {
      var layer = new carto.layer.Layer(source, style);

      expect(layer.getSource()).toEqual(source);
      expect(layer.getStyle()).toEqual(style);
    });

    it('should assign a unique layer ID string', function () {
      var layer1 = new carto.layer.Layer(source, style);
      var layer2 = new carto.layer.Layer(source, style);

      var id1 = layer1.getId();
      var id2 = layer2.getId();

      expect(id1).toMatch(/L\d+/);
      expect(id2).toMatch(/L\d+/);
      expect(id1).not.toEqual(id2);
    });

    it('should build a new Layer params: (source, style, options)', function () {
      var layer = new carto.layer.Layer(source, style, {
        featureClickColumns: [ 'a', 'b' ],
        featureOverColumns: [ 'c', 'd' ]
      });

      expect(layer.getSource()).toEqual(source);
      expect(layer.getStyle()).toEqual(style);
      expect(layer.getFeatureClickColumns()).toEqual([ 'a', 'b' ]);
      expect(layer.getFeatureOverColumns()).toEqual([ 'c', 'd' ]);
    });
  });

  describe('.setSource', function () {
    var layer;
    var newSource;

    beforeEach(function () {
      layer = new carto.layer.Layer(source, style);
      newSource = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple LIMIT 10');
    });

    describe("when the layer hasn't been set an engine", function () {
      it('should normally add the source', function () {
        layer.setSource(newSource);

        expect(layer.getSource()).toEqual(newSource);
      });
    });

    describe('when the layer has been set an engine', function () {
      beforeEach(function () {
        layer.$setEngine({ on: function () {}, reload: function () {} });
      });

      describe('when the source has no engine', function () {
        it('should normally add the source', function () {
          layer.setSource(newSource);

          var actualSource = layer.$getInternalModel().get('source');
          var expectedSource = newSource.$getInternalModel();
          expect(actualSource).toEqual(expectedSource);
        });
      });

      describe('when the source has an engine', function () {
        it('should add the source if the engines are the same', function () { });
        it('should throw an error if the engines are different', function () { });
      });
    });
  });
});
