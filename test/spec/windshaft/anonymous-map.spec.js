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
      sql: 'sql3',
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
    it('should generate the payload to instantiate the map', function () {
      expect(this.map.toJSON()).toEqual({
        'buffersize': {
          'mvt': 0
        },
        'layers': [
          {
            'id': 'layer1',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS1',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'sql': 'sql1'
            }
          },
          {
            'id': 'layer2',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'sql': 'sql2'
            }
          },
          {
            'id': 'layer3',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS3',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'sql': 'sql3'
            }
          }
        ],
        'dataviews': {},
        'analyses': []
      });
    });

    it('should include the sql_wrap option', function () {
      this.cartoDBLayer1.set('sql_wrap', 'sql_wrap_1', { silent: true });

      expect(this.map.toJSON().layers[0]).toEqual({
        'id': 'layer1',
        'type': 'mapnik',
        'options': {
          'cartocss': 'cartoCSS1',
          'cartocss_version': '2.0',
          'interactivity': [ 'cartodb_id' ],
          'sql': 'sql1',
          'sql_wrap': 'sql_wrap_1'
        }
      });
    });

    it('should include the interactiviy and attributes options for layers that have infowindow with fields', function () {
      this.cartoDBLayer1.infowindow.fields.add({ name: 'something' });

      expect(this.map.toJSON()).toEqual({
        'buffersize': {
          'mvt': 0
        },
        'layers': [
          {
            'id': 'layer1',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS1',
              'cartocss_version': '2.0',
              'interactivity': [
                'cartodb_id',
                'something'
              ],
              'attributes': {
                id: 'cartodb_id',
                columns: [ 'something' ]
              },
              'sql': 'sql1'
            }
          },
          {
            'id': 'layer2',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'sql': 'sql2'
            }
          },
          {
            'id': 'layer3',
            'type': 'mapnik',
            'options': {
              'cartocss': 'cartoCSS3',
              'cartocss_version': '2.0',
              'interactivity': [ 'cartodb_id' ],
              'sql': 'sql3'
            }
          }
        ],
        'dataviews': {},
        'analyses': []
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
        this.layersCollection.reset(new TorqueLayer({
          id: 'torqueId',
          sql: 'sql',
          cartocss: 'cartocss'
        }, {
          vis: this.vis
        }));

        expect(this.map.toJSON().layers).toEqual([
          {
            'id': 'torqueId',
            'type': 'torque',
            'options': {
              'sql': 'sql',
              'cartocss': 'cartocss',
              'cartocss_version': '2.1.0'
            }
          }
        ]);
      });
    });

    it('should include dataviews', function () {
      this.analysisCollection.reset([
        createFakeAnalysis({ id: 'a0' }),
        createFakeAnalysis({ id: 'a1' })
      ]);

      var dataview1 = new HistogramDataviewModel({
        id: 'dataviewId1',
        column: 'column1',
        column_type: 'date',
        aggregation: 'week',
        source: {
          id: 'a0'
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
          id: 'a1'
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
            id: 'a0'
          },
          options: {
            column: 'column1',
            aggregation: 'week'
          }
        },
        dataviewId2: {
          type: 'histogram',
          source: {
            id: 'a1'
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
        var analysis = { id: 'c1' };
        this.analysisCollection.add(analysis);

        this.cartoDBLayer1.update({
          source: 'c1',
          cartocss: '#trade_area { ... }'
        }, { silent: true });

        expect(this.map.toJSON().analyses).toEqual([ analysis ]);
      });

      it('should include a source analysis for dataviews whose source is a layer that has sql', function () {
        // Create a dataview whose source is the layer
        var dataview = createFakeDataview({
          id: 'dataviewId1',
          source: { id: this.cartoDBLayer1.id }
        }, this.vis, this.map, this.cartoDBLayer1, this.analysisCollection);

        this.dataviewsCollection.add(dataview);

        expect(this.map.toJSON().analyses).toEqual([
          {
            id: this.cartoDBLayer1.id,
            type: 'source',
            params: {
              query: this.cartoDBLayer1.get('sql')
            }
          }
        ]);
      });

      it('should include a source analysis for dataviews whose source is a layer that has a source', function () {
        var analysis = { id: 'c1' };
        this.analysisCollection.add(analysis);

        // CartoDB layer points to an analysis and has no sql
        this.cartoDBLayer1.update({
          source: 'c1',
          sql: undefined,
          cartocss: '#trade_area { ... }'
        }, { silent: true });

        // Create a dataview whose source is the layer
        var dataview = createFakeDataview({
          id: 'dataviewId1',
          source: { id: this.cartoDBLayer1.id }
        }, this.vis, this.map, this.cartoDBLayer1, this.analysisCollection);

        this.dataviewsCollection.add(dataview);

        expect(this.map.toJSON().analyses).toEqual([
          analysis
        ]);
      });

      it("should NOT include an analysis if it's part of the analysis of another layer", function () {
        var analysis1 = this.analysisFactory.analyse({
          id: 'c1',
          type: 'union',
          params: {
            join_on: 'cartodb_id',
            source: {
              id: 'a2',
              type: 'estimated-population',
              params: {
                columnName: 'estimated_people',
                source: {
                  id: 'a1',
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
          id: 'a2',
          type: 'estimated-population',
          params: {
            columnName: 'estimated_people',
            source: {
              id: 'a1',
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
          source: analysis1.get('id'),
          cartocss: '#union { ... }'
        }, { silent: true });

        this.cartoDBLayer2.update({
          source: analysis2.get('id'),
          cartocss: '#union { ... }'
        }, { silent: true });

        expect(this.map.toJSON().analyses).toEqual([
          {
            'id': 'c1',
            'type': 'union',
            'params': {
              'join_on': 'cartodb_id',
              'source': {
                'id': 'a2',
                'type': 'estimated-population',
                'params': {
                  'columnName': 'estimated_people',
                  'source': {
                    'id': 'a1',
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
          }
        ]);
      });

      it('should only include an analysis once', function () {
        var analysis = { id: 'a0' };
        this.analysisCollection.add(analysis);

        // Layer has a0 as it's source
        this.cartoDBLayer1.update({
          source: 'a0',
          cartocss: '#trade_area { ... }'
        }, { silent: true });

        // This datativew also has a0 as it's source
        var dataview1 = createFakeDataview({
          id: 'dataviewId1',
          source: {
            id: 'a0'
          }
        }, this.vis, this.map, this.cartoDBLayer1, this.analysisCollection);

        // This dataview also has a0 as it's source
        var dataview2 = createFakeDataview({
          id: 'dataviewId1',
          source: {
            id: 'a0'
          }
        }, this.vis, this.map, this.cartoDBLayer1, this.analysisCollection);

        this.dataviewsCollection.reset([ dataview1, dataview2 ]);

        // The analysis is only included once
        expect(this.map.toJSON().analyses).toEqual([ analysis ]);
      });
    });
  });
});
