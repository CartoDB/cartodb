var Backbone = require('backbone');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var LayersSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/layers-serializer');
var PlainLayer = require('../../../../../src/geo/map/plain-layer');
var TileLayer = require('../../../../../src/geo/map/tile-layer');
var TorqueLayer = require('../../../../../src/geo/map/torque-layer');
var VisModel = require('../../../../../src/vis/vis');

describe('layers-serializer', function () {
  describe('.serialize', function () {
    it('should serialize a layer collection with one layer of each kind', function () {
      var visMock = new VisModel();
      var sourceMock = _createFakeAnalysis({ id: 'a1' });

      var cartoDBLayer = new CartoDBLayer({
        id: 'l1',
        source: sourceMock,
        cartocss: 'cartoCSS1',
        cartocss_version: '2.0'
      }, {
        vis: visMock,
        analysisCollection: new Backbone.Collection()
      });

      var plainLayer = new PlainLayer({
        id: 'l2',
        color: 'COLOR',
        image: 'http://carto.com/image.png'
      }, { vis: {} });

      var torqueLayer = new TorqueLayer({
        id: 'l3',
        source: sourceMock,
        cartocss: 'cartocss'
      }, {
        vis: visMock
      });

      var tileLayer = new TileLayer({
        id: 'l4',
        urlTemplate: 'URL_TEMPLATE',
        subdomains: 'abc',
        tms: false
      }, { vis: {} });

      var layersCollection = new Backbone.Collection([cartoDBLayer, plainLayer, torqueLayer, tileLayer]);

      var actual = LayersSerializer.serialize(layersCollection);
      var expected = [
        {
          'id': 'l1',
          'type': 'mapnik',
          'options': {
            'cartocss': 'cartoCSS1',
            'cartocss_version': '2.0',
            'interactivity': [ 'cartodb_id' ],
            'source': { id: 'a1' }
          }
        },
        {
          'id': 'l2',
          'type': 'plain',
          'options': {
            'color': 'COLOR',
            'imageUrl': 'http://carto.com/image.png'
          }
        },
        {
          'id': 'l3',
          'type': 'torque',
          'options': {
            'source': { id: 'a1' },
            'cartocss': 'cartocss',
            'cartocss_version': '2.1.0'
          }
        },
        {
          'id': 'l4',
          'type': 'http',
          'options': {
            'urlTemplate': 'URL_TEMPLATE',
            'subdomains': 'abc',
            'tms': false
          }
        }
      ];
      expect(actual).toEqual(expected);
    });
  });
});

function _createFakeAnalysis (attrs) {
  var fakeAnalysis = new Backbone.Model(attrs);
  fakeAnalysis.findAnalysisById = jasmine.createSpy('findAnalysisById').and.returnValue(undefined);
  return fakeAnalysis;
}
