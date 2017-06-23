var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var WindshaftClient = require('../../../src/windshaft/client');
var NamedMap = require('../../../src/windshaft/named-map');

describe('windshaft/named-map', function () {
  beforeEach(function () {
    this.analysisCollection = new Backbone.Collection();
    this.vis = new VisModel();
    this.cartoDBLayer1 = new CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    }, {
      vis: this.vis,
      analysisCollection: this.analysisCollection
    });
    this.cartoDBLayer2 = new CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    }, {
      vis: this.vis,
      analysisCollection: this.analysisCollection
    });
    this.cartoDBLayer3 = new CartoDBLayer({
      id: 'layer3',
      sql: 'sql2',
      cartocss: 'cartoCSS3',
      cartocss_version: '2.0'
    }, {
      vis: this.vis,
      analysisCollection: this.analysisCollection
    });

    this.client = new WindshaftClient({
      endpoints: {
        get: 'v1',
        post: 'v1'
      },
      urlTemplate: 'http://{user}.wadus.com',
      userName: 'rambo'
    });

    this.modelUpdater = jasmine.createSpyObj('modelUpdater', ['updateModels']);

    var isGoogleMapsBaseLayer = function () {
      return false;
    };

    this.cartoDBLayer1.isGoogleMapsBaseLayer = isGoogleMapsBaseLayer;
    this.cartoDBLayer2.isGoogleMapsBaseLayer = isGoogleMapsBaseLayer;
    this.cartoDBLayer3.isGoogleMapsBaseLayer = isGoogleMapsBaseLayer;

    this.layersCollection = new Backbone.Collection([this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3]);

    this.map = new NamedMap({}, {
      client: this.client,
      modelUpdater: this.modelUpdater,
      statTag: 'stat_tag',
      dataviewsCollection: new Backbone.Collection(),
      layersCollection: this.layersCollection,
      analysisCollection: this.analysisCollection,
      windshaftSettings: {}
    });
  });

  describe('.toJSON', function () {
    it('should generate the payload to instantiate the map', function () {
      expect(this.map.toJSON()).toEqual({ buffersize: {mvt: 0}, styles: { 0: 'cartoCSS1', 1: 'cartoCSS2', 2: 'cartoCSS3' } });
    });

    it('should mark hidden layers as hidden', function () {
      this.cartoDBLayer1.set('visible', false, { silent: true });
      this.cartoDBLayer3.set('visible', false, { silent: true });
      expect(this.map.toJSON()).toEqual({ buffersize: {mvt: 0}, styles: { 0: 'cartoCSS1', 1: 'cartoCSS2', 2: 'cartoCSS3' } });
    });

    it('should send styles using the right indexes', function () {
      var tiledLayer = new Backbone.Model({ type: 'Tiled' });
      tiledLayer.isGoogleMapsBaseLayer = function () {
        return false;
      };

      this.layersCollection.reset([tiledLayer, this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3]);

      expect(this.map.toJSON().styles).toEqual({
        1: 'cartoCSS1', 2: 'cartoCSS2', 3: 'cartoCSS3'
      });
    });

    it('should send styles using the right indexes with Google basemaps', function () {
      var gmdLayer = new Backbone.Model({ type: 'GMapsBase' });
      gmdLayer.isGoogleMapsBaseLayer = function () {
        return true;
      };

      this.layersCollection.reset([gmdLayer, this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3]);

      expect(this.map.toJSON().styles).toEqual({
        0: 'cartoCSS1', 1: 'cartoCSS2', 2: 'cartoCSS3'
      });
    });
  });
});
