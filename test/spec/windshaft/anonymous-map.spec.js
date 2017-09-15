var _ = require('underscore');
var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var TileLayer = require('../../../src/geo/map/tile-layer');
var PlainLayer = require('../../../src/geo/map/plain-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var WindshaftClient = require('../../../src/windshaft/client');
var AnonymousMap = require('../../../src/windshaft/anonymous-map');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

var createFakeAnalysis = function (attrs) {
  var fakeAnalysis = new Backbone.Model(attrs);
  fakeAnalysis.findAnalysisById = jasmine.createSpy('findAnalysisById').and.returnValue(undefined);
  return fakeAnalysis;
};

var createFakeDataview = function (attrs, visModel, windshaftMap, layer, analysisCollection) {
  if (!attrs.id) { throw new Error('id is required'); }
  attrs = _.defaults(attrs, {
    column: 'column1',
    bins: 5,
    source: {
      id: 'a0'
    }
  });

  return new HistogramDataviewModel(attrs, {
    map: jasmine.createSpyObj('map', ['getViewBounds', 'bind']),
    vis: visModel,
    windshaftMap: windshaftMap,
    layer: layer,
    analysisCollection: new Backbone.Collection()
  });
};

describe('windshaft/anonymous-map', function () {
  beforeEach(function () {
    this.vis = new VisModel();

    var source1 = createFakeAnalysis({ id: 'a1' });
    var source2 = createFakeAnalysis({ id: 'a2' });
    var source3 = createFakeAnalysis({ id: 'a3' });

    this.analysisCollection = new Backbone.Collection([
      source1, source2, source3
    ]);

    this.cartoDBLayer1 = new CartoDBLayer({
      id: 'layer1',
      source: source1,
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    }, {
      vis: this.vis,
      analysisCollection: this.analysisCollection
    });
    this.cartoDBLayer2 = new CartoDBLayer({
      id: 'layer2',
      source: source2,
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    }, {
      vis: this.vis,
      analysisCollection: this.analysisCollection
    });
    this.cartoDBLayer3 = new CartoDBLayer({
      id: 'layer3',
      source: source3,
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
      urlTemplate: 'http://{user}.example.com',
      userName: 'rambo'
    });

    this.modelUpdater = jasmine.createSpyObj('modelUpdater', ['updateModels']);

    this.dataviewsCollection = new Backbone.Collection();
    this.layersCollection = new Backbone.Collection([this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3]);
    this.map = new AnonymousMap({}, {
      client: this.client,
      modelUpdater: this.modelUpdater,
      statTag: 'stat_tag',
      dataviewsCollection: this.dataviewsCollection,
      layersCollection: this.layersCollection,
      analysisCollection: this.analysisCollection,
      windshaftSettings: {}
    });
  });

  describe('.toJSON', function () {
    it('should include buffersize', function () {
      expect(this.map.toJSON().buffersize).toEqual({
        'mvt': 0
      });
    });

    describe('mapnik layers', function () {
      it('should generate the payload to instantiate the map', function () {
        expect(this.map.toJSON().layers).toEqual([
          {
            'id': 'layer1',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS1',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'source': { id: 'a1' }
            }
          },
          {
            'id': 'layer2',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'source': { id: 'a2' }
            }
          },
          {
            'id': 'layer3',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS3',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'source': { id: 'a3' }
            }
          }
        ]);
      });

      it('should include the sql_wrap option', function () {
        this.cartoDBLayer1.set('sql_wrap', 'sql_wrap_1', { silent: true });

        expect(this.map.toJSON().layers[0].options.sql_wrap).toEqual('sql_wrap_1');
      });

      it('should include the interactiviy and attributes options for layers that have infowindow with fields', function () {
        this.cartoDBLayer1.infowindow.fields.add({ name: 'something' });

        expect(this.map.toJSON().layers[0].options.interactivity).toEqual([
          'cartodb_id',
          'something'
        ]);
        expect(this.map.toJSON().layers[0].options.attributes).toEqual({
          id: 'cartodb_id',
          columns: [ 'something' ]
        });

        expect(this.map.toJSON().layers[1].options.interactivity).toEqual([ 'cartodb_id' ]);
        expect(this.map.toJSON().layers[1].options.attributes).toBeUndefined();

        expect(this.map.toJSON().layers[2].options.interactivity).toEqual([ 'cartodb_id' ]);
        expect(this.map.toJSON().layers[2].options.attributes).toBeUndefined();
      });
    });

    describe('http layers', function () {
      it('should be included', function () {
        this.layersCollection.reset(new TileLayer({
          id: 'LAYER_ID',
          urlTemplate: 'URL_TEMPLATE',
          subdomains: 'abc',
          tms: false
        }, { vis: {} }));

        expect(this.map.toJSON().layers).toEqual([
          {
            'id': 'LAYER_ID',
            'type': 'http',
            'options': {
              'urlTemplate': 'URL_TEMPLATE',
              'subdomains': 'abc',
              'tms': false
            }
          }
        ]);
      });
    });

    describe('plain layers', function () {
      it('should be included', function () {
        this.layersCollection.reset(new PlainLayer({
          id: 'LAYER_ID',
          color: 'COLOR',
          image: 'http://carto.com/image.png'
        }, { vis: {} }));

        expect(this.map.toJSON().layers).toEqual([
          {
            'id': 'LAYER_ID',
            'type': 'plain',
            'options': {
              'color': 'COLOR',
              'imageUrl': 'http://carto.com/image.png'
            }
          }
        ]);
      });
    });

    describe('torque layers', function () {
      it('should be included', function () {
        var sourceAnalysis = createFakeAnalysis({ id: 'a0' });

        this.layersCollection.reset(new TorqueLayer({
          id: 'torqueId',
          source: sourceAnalysis,
          cartocss: 'cartocss'
        }, {
          vis: this.vis
        }));

        this.analysisCollection.reset([ sourceAnalysis ]);

        expect(this.map.toJSON().layers).toEqual([
          {
            'id': 'torqueId',
            'type': 'torque',
            'options': {
              'source': { id: 'a0' },
              'cartocss': 'cartocss',
              'cartocss_version': '2.1.0'
            }
          }
        ]);
      });
    });

    it('dataviews', function () {
      var dataview1 = new HistogramDataviewModel({
        id: 'dataviewId1',
        column: 'column1',
        column_type: 'date',
        aggregation: 'week',
        source: {
          id: 'a1'
        }
      }, {
        map: jasmine.createSpyObj('map', ['getViewBounds', 'bind']),
        vis: this.vis,
        windshaftMap: this.map,
        layer: this.cartoDBLayer1,
        analysisCollection: new Backbone.Collection()
      });

      var dataview2 = new HistogramDataviewModel({
        id: 'dataviewId2',
        column: 'column2',
        column_type: 'number',
        bins: 5,
        source: {
          id: 'a2'
        }
      }, {
        map: jasmine.createSpyObj('map', ['getViewBounds', 'bind']),
        vis: this.vis,
        windshaftMap: this.map,
        layer: this.cartoDBLayer2,
        analysisCollection: new Backbone.Collection()
      });

      this.cartoDBLayer2.set('visible', false, { silent: true });

      this.dataviewsCollection.reset([ dataview1, dataview2 ]);

      expect(this.map.toJSON().dataviews).toEqual({
        dataviewId1: {
          type: 'histogram',
          source: {
            id: 'a1'
          },
          options: {
            column: 'column1',
            aggregation: 'week'
          }
        },
        dataviewId2: {
          type: 'histogram',
          source: {
            id: 'a2'
          },
          options: {
            column: 'column2',
            bins: 5
          }
        }
      });
    });

    describe('.analyses section', function () {
      beforeEach(function () {
        var fakeCamshaftReference = {
          getSourceNamesForAnalysisType: function (analysisType) {
            var map = {
              'source': [],
              'trade-area': ['source'],
              'estimated-population': ['source'],
              'point-in-polygon': ['points_source', 'polygons_source'],
              'union': ['source']
            };
            if (!map[analysisType]) {
              throw new Error('analysis type ' + analysisType + ' not supported');
            }
            return map[analysisType];
          },

          getParamNamesForAnalysisType: function (analysisType) {
            var map = {
              'source': ['query'],
              'trade-area': ['kind', 'time'],
              'estimated-population': ['columnName'],
              'point-in-polygon': [],
              'union': ['join_on']
            };
            if (!map[analysisType]) {
              throw new Error('analysis type ' + analysisType + ' not supported');
            }
            return map[analysisType];
          }
        };

        this.analysisFactory = new AnalysisFactory({
          analysisCollection: this.analysisCollection,
          camshaftReference: fakeCamshaftReference,
          vis: this.vis
        });
      });

      it('should include an analysis for layers that have a source', function () {
        expect(this.map.toJSON().analyses).toEqual([
          { id: 'a1' },
          { id: 'a2' },
          { id: 'a3' }
        ]);
      });

      it("should NOT include an analysis if it's part of the analysis of another layer", function () {
        var analysis1 = this.analysisFactory.analyse({
          id: 'c1',
          type: 'union',
          params: {
            join_on: 'cartodb_id',
            source: {
              id: 'b2',
              type: 'estimated-population',
              params: {
                columnName: 'estimated_people',
                source: {
                  id: 'b1',
                  type: 'trade-area',
                  params: {
                    kind: 'walk',
                    time: 300,
                    source: {
                      id: 'b0',
                      type: 'source',
                      params: {
                        query: 'select * from subway_stops'
                      }
                    }
                  }
                }
              }
            }
          }
        });
        var analysis2 = this.analysisFactory.analyse({
          id: 'b2',
          type: 'estimated-population',
          params: {
            columnName: 'estimated_people',
            source: {
              id: 'b1',
              type: 'trade-area',
              params: {
                kind: 'walk',
                time: 300,
                source: {
                  id: 'b0',
                  type: 'source',
                  params: {
                    query: 'select * from subway_stops'
                  }
                }
              }
            }
          }
        });

        this.cartoDBLayer1.update({
          source: analysis1,
          cartocss: '#union { ... }'
        }, { silent: true });

        this.cartoDBLayer2.update({
          source: analysis2,
          cartocss: '#union { ... }'
        }, { silent: true });

        expect(_.map(this.map.toJSON().analyses, 'id')).toContain('c1');
        expect(_.map(this.map.toJSON().analyses, 'id')).not.toContain('b2');
        expect(_.find(this.map.toJSON().analyses, function (analysis) {
          return analysis.id === 'c1';
        })).toEqual({
          'id': 'c1',
          'type': 'union',
          'params': {
            'join_on': 'cartodb_id',
            'source': {
              'id': 'b2',
              'type': 'estimated-population',
              'params': {
                'columnName': 'estimated_people',
                'source': {
                  'id': 'b1',
                  'type': 'trade-area',
                  'params': {
                    'kind': 'walk',
                    'time': 300,
                    'source': {
                      'id': 'b0',
                      'type': 'source',
                      'params': {
                        'query': 'select * from subway_stops'
                      }
                    }
                  }
                }
              }
            }
          }
        });
      });

      it('should only include an analysis once', function () {
        this.analysisCollection.reset([]);
        this.layersCollection.reset(this.cartoDBLayer1);

        var analysis = this.analysisFactory.analyse({
          id: 'd0',
          type: 'source',
          params: {
            query: 'select * from subway_stops'
          }
        });

        // Layer has d0 as it's source
        this.cartoDBLayer1.update({
          source: analysis,
          cartocss: '#trade_area { ... }'
        }, { silent: true });

        // This datativew also has a0 as it's source
        var dataview1 = createFakeDataview({
          id: 'dataviewId1',
          source: {
            id: 'd0'
          }
        }, this.vis, this.map, this.cartoDBLayer1, this.analysisCollection);

        // This dataview also has a0 as it's source
        var dataview2 = createFakeDataview({
          id: 'dataviewId1',
          source: {
            id: 'd0'
          }
        }, this.vis, this.map, this.cartoDBLayer1, this.analysisCollection);

        this.dataviewsCollection.reset([ dataview1, dataview2 ]);

        // The analysis is only included once
        expect(this.map.toJSON().analyses).toEqual([
          {
            id: 'd0',
            type: 'source',
            params: {
              query: 'select * from subway_stops'
            }
          }
        ]);
      });
    });
  });
});
