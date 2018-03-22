var Backbone = require('backbone');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var PlainLayer = require('../../../../../src/geo/map/plain-layer');
var TileLayer = require('../../../../../src/geo/map/tile-layer');
var TorqueLayer = require('../../../../../src/geo/map/torque-layer');
var GMapsBaseLayer = require('../../../../../src/geo/map/gmaps-base-layer');
var LayersSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/layers-serializer');
var MockFactory = require('../../../../helpers/mockFactory');
var createEngine = require('../../../fixtures/engine.fixture.js');

describe('layers-serializer', function () {
  describe('.serialize', function () {
    var engineMock;
    var sourceMock;
    var layersCollection;

    // Create all test objects once
    beforeAll(function () {
      layersCollection = new Backbone.Collection();
      engineMock = createEngine();
      sourceMock = MockFactory.createAnalysisModel({ id: 'a1' });
    });

    describe('mapnik layer', function () {
      it('should serialize a cartodb layer with no aggregation', function () {
        var cartoDBLayer = new CartoDBLayer({
          id: 'l1',
          source: sourceMock,
          cartocss: 'cartoCSS1',
          cartocss_version: '2.0'
        }, {
          engine: engineMock
        });
        layersCollection.reset([cartoDBLayer]);

        var actual = LayersSerializer.serialize(layersCollection);
        var expected = [{
          'id': 'l1',
          'type': 'mapnik',
          'options': {
            'cartocss': 'cartoCSS1',
            'cartocss_version': '2.0',
            'interactivity': ['cartodb_id'],
            'source': { id: 'a1' }
          }
        }];
        expect(actual).toEqual(expected);
      });

      it('should serialize a cartodb layer with aggregation', function () {
        var cartoDBLayer = new CartoDBLayer({
          id: 'l1',
          source: sourceMock,
          cartocss: 'cartoCSS1',
          cartocss_version: '2.0'
        }, {
          engine: engineMock,
          aggregation: {
            threshold: 1000,
            resolution: 4,
            placement: 'point-sample',
            columns: {
              'population': {
                aggregate_function: 'sum',
                aggregated_column: 'pop_max'
              },
              'states': {
                aggregate_function: 'sum',
                aggregated_column: 'states'
              }
            }
          }
        });
        layersCollection.reset([cartoDBLayer]);

        var actual = LayersSerializer.serialize(layersCollection);

        var expected = [{
          'id': 'l1',
          'type': 'mapnik',
          'options': {
            'cartocss': 'cartoCSS1',
            'cartocss_version': '2.0',
            'interactivity': ['cartodb_id'],
            'source': { id: 'a1' },
            'aggregation': {
              'threshold': 1000,
              'resolution': 4,
              'placement': 'point-sample',
              'columns': {
                'population': {
                  'aggregate_function': 'sum',
                  'aggregated_column': 'pop_max'
                },
                'states': {
                  'aggregate_function': 'sum',
                  'aggregated_column': 'states'
                }
              }
            }
          }
        }];
        expect(actual).toEqual(expected);
      });

      it('should serialize a cartodb layer with propper zoom options', function () {
        var cartoDBLayer = new CartoDBLayer({
          id: 'l1',
          source: sourceMock,
          cartocss: 'cartoCSS1',
          cartocss_version: '2.0',
          minzoom: 5,
          maxzoom: 9
        },
        {
          engine: engineMock
        });
        layersCollection.reset([cartoDBLayer]);

        var actual = LayersSerializer.serialize(layersCollection);
        var expected = [{
          'id': 'l1',
          'type': 'mapnik',
          'options': {
            'cartocss': 'cartoCSS1',
            'cartocss_version': '2.0',
            'interactivity': ['cartodb_id'],
            'source': { id: 'a1' },
            'minzoom': 5,
            'maxzoom': 9
          }
        }];
        expect(actual).toEqual(expected);
      });
    });

    it('should serialize a plain layer', function () {
      var plainLayer = new PlainLayer({
        id: 'l2',
        color: 'COLOR',
        image: 'http://carto.com/image.png'
      }, { engine: engineMock });
      layersCollection.reset([plainLayer]);

      var actual = LayersSerializer.serialize(layersCollection);
      var expected = [{
        'id': 'l2',
        'type': 'plain',
        'options': {
          'color': 'COLOR',
          'imageUrl': 'http://carto.com/image.png'
        }
      }];
      expect(actual).toEqual(expected);
    });

    it('should serialize a torque layer', function () {
      var torqueLayer = new TorqueLayer({
        id: 'l3',
        source: sourceMock,
        cartocss: 'cartocss'
      }, {
        engine: engineMock
      });
      layersCollection.reset([torqueLayer]);

      var actual = LayersSerializer.serialize(layersCollection);
      var expected = [{
        'id': 'l3',
        'type': 'torque',
        'options': {
          'source': { id: 'a1' },
          'cartocss': 'cartocss',
          'cartocss_version': '2.1.0'
        }
      }];
      expect(actual).toEqual(expected);
    });

    it('should serialize a tile layer', function () {
      var tileLayer = new TileLayer({
        id: 'l4',
        urlTemplate: 'URL_TEMPLATE',
        subdomains: 'abc',
        tms: false
      }, { engine: engineMock });
      layersCollection.reset([tileLayer]);

      var actual = LayersSerializer.serialize(layersCollection);
      var expected = [{
        'id': 'l4',
        'type': 'http',
        'options': {
          'urlTemplate': 'URL_TEMPLATE',
          'subdomains': 'abc',
          'tms': false
        }
      }];
      expect(actual).toEqual(expected);
    });

    it('should not serialize GMapsBase layers', function () {
      var gmapsBaseLayer = new GMapsBaseLayer({
        id: 'l4',
        baseType: 'roadmap'
      }, { engine: engineMock });
      layersCollection.reset([gmapsBaseLayer]);

      var actual = LayersSerializer.serialize(layersCollection);
      var expected = [];
      expect(actual).toEqual(expected);
    });
  });
});
