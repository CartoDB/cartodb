var Backbone = require('backbone');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var LayersSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/layers-serializer');
var PlainLayer = require('../../../../../src/geo/map/plain-layer');
var TileLayer = require('../../../../../src/geo/map/tile-layer');
var TorqueLayer = require('../../../../../src/geo/map/torque-layer');
var VisModel = require('../../../../../src/vis/vis');

describe('layers-serializer', function () {
  describe('.serialize', function () {
    var visMock;
    var sourceMock;
    var cartoDBLayer;
    var plainLayer;
    var torqueLayer;
    var tileLayer;
    // Create all test objects once
    beforeAll(function () {
      visMock = new VisModel();
      sourceMock = _createFakeAnalysis({ id: 'a1' });

      cartoDBLayer = new CartoDBLayer({
        id: 'l1',
        source: sourceMock,
        cartocss: 'cartoCSS1',
        cartocss_version: '2.0'
      }, {
        vis: visMock,
        analysisCollection: new Backbone.Collection()
      });

      plainLayer = new PlainLayer({
        id: 'l2',
        color: 'COLOR',
        image: 'http://carto.com/image.png'
      }, { vis: {} });

      torqueLayer = new TorqueLayer({
        id: 'l3',
        source: sourceMock,
        cartocss: 'cartocss'
      }, {
        vis: visMock
      });

      tileLayer = new TileLayer({
        id: 'l4',
        urlTemplate: 'URL_TEMPLATE',
        subdomains: 'abc',
        tms: false
      }, { vis: {} });
    });
    it('should serialize a cartodb layer', function () {
      var layersCollection = new Backbone.Collection([cartoDBLayer]);
      var actual = LayersSerializer.serialize(layersCollection);
      var expected = [{
        'id': 'l1',
        'type': 'mapnik',
        'options': {
          'cartocss': 'cartoCSS1',
          'cartocss_version': '2.0',
          'interactivity': [ 'cartodb_id' ],
          'source': { id: 'a1' }
        }
      }];
      expect(actual).toEqual(expected);
    });
    it('should serialize a plain layer', function () {
      var layersCollection = new Backbone.Collection([plainLayer]);
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
      var layersCollection = new Backbone.Collection([torqueLayer]);
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
      var layersCollection = new Backbone.Collection([tileLayer]);
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
  });
});

function _createFakeAnalysis (attrs) {
  var fakeAnalysis = new Backbone.Model(attrs);
  fakeAnalysis.findAnalysisById = jasmine.createSpy('findAnalysisById').and.returnValue(undefined);
  return fakeAnalysis;
}
