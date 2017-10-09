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
    var visModel;
    var mapModel;
    var layersCollection;
    var dataviewsCollection;
    var analysisCollection;
    var analysisService;
    var analysisModel;
    var payload;

    beforeEach(function () {
      mapModel = new Backbone.Model();
      visModel = new Backbone.Model();

      // Analyses
      analysisCollection = new Backbone.Collection();
      analysisService = new AnalysisService({
        analysisCollection: analysisCollection,
        camshaftReference: fakeCamshaftReference,
        vis: visModel
      });
      analysisModel = analysisService.createAnalysis({
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
        vis: visModel
      });
      layersCollection = new Backbone.Collection([ cartoDBLayer ]);

      // Dataviews
      var dataview = new MyDataviewModel({
        id: 'DATAVIEW_ID',
        source: analysisModel
      }, {
        map: mapModel,
        vis: visModel
      });
      dataviewsCollection = new Backbone.Collection([ dataview ]);

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
