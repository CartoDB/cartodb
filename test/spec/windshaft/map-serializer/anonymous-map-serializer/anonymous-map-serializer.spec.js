var Backbone = require('backbone');
var AnalysisService = require('../../../../../src/analysis/analysis-service.js');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var DataviewModelBase = require('../../../../../src/dataviews/dataview-model-base');
var AnonymousMapSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/anonymous-map-serializer');

var MyDataviewModel = DataviewModelBase.extend({
  toJSON: function () {
    return {};
  }
});

describe('anonymous-map-serializer', function () {
  describe('.serialize', function () {
    var engineMock;
    var mapModel;
    var layersCollection;
    var dataviewsCollection;
    var analysisService;
    var analysisModel;
    var payload;

    beforeEach(function () {
      mapModel = new Backbone.Model();
      engineMock = new Backbone.Model();
      layersCollection = new Backbone.Collection();
      dataviewsCollection = new Backbone.Collection();

      // Analyses
      analysisService = new AnalysisService({
        engine: engineMock,
        camshaftReference: fakeCamshaftReference
      });
      analysisModel = analysisService.analyse({
        id: 'ANALYSIS_ID',
        type: 'source',
        params: {
          query: 'select * from subway_stops'
        }
      });

      // Layers
      var cartoDBLayer = new CartoDBLayer({
        id: 'LAYER_ID',
        source: analysisModel,
        cartocss: 'cartocssMock',
        cartocss_version: '2.0'
      }, {
        engine: engineMock
      });
      layersCollection.add(cartoDBLayer);

      // Dataviews
      var dataview = new MyDataviewModel({
        id: 'DATAVIEW_ID',
        source: analysisModel
      }, {
        map: mapModel,
        engine: engineMock
      });
      dataviewsCollection.add(dataview);

      // Serialized payload
      payload = AnonymousMapSerializer.serialize(layersCollection, dataviewsCollection);
    });

    it('should include buffersize', function () {
      expect(payload.buffersize).toEqual({
        mvt: 0
      });
    });

    it('should include one layer', function () {
      expect(payload.layers.length).toEqual(1);
      expect(payload.layers[0].id).toEqual('LAYER_ID');
    });

    it('should include one dataview', function () {
      expect(Object.keys(payload.dataviews).length).toEqual(1);
      expect(payload.dataviews['DATAVIEW_ID']).toBeDefined();
    });

    it('should include one analysis', function () {
      expect(payload.analyses.length).toEqual(1);
      expect(payload.analyses[0].id).toEqual('ANALYSIS_ID');
    });
  });
});

var fakeCamshaftReference = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': []
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  },

  getParamNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': ['query']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  }
};
