var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var WindshaftClient = require('../../../src/windshaft/client');
var AnonymousMap = require('../../../src/windshaft/anonymous-map');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

describe('windshaft/anonymous-map', function () {
  beforeEach(function () {
    this.analysisCollection = new Backbone.Collection();
    this.cartoDBLayer1 = new CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    }, {
      analysisCollection: this.analysisCollection
    });
    this.cartoDBLayer2 = new CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    }, {
      analysisCollection: this.analysisCollection
    });
    this.cartoDBLayer3 = new CartoDBLayer({
      id: 'layer3',
      sql: 'sql3',
      cartocss: 'cartoCSS3',
      cartocss_version: '2.0'
    }, {
      analysisCollection: this.analysisCollection
    });

    this.client = new WindshaftClient({
      endpoint: 'v1',
      urlTemplate: 'http://{user}.wadus.com',
      userName: 'rambo'
    });

    this.dataviewsCollection = new Backbone.Collection();

    this.map = new AnonymousMap({}, {
      client: this.client,
      statTag: 'stat_tag',
      dataviewsCollection: this.dataviewsCollection,
      layersCollection: new Backbone.Collection([this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3]),
      analysisCollection: this.analysisCollection
    });
  });

  describe('.toJSON', function () {
    it('should generate the payload to instantiate the map', function () {
      expect(this.map.toJSON()).toEqual({
        'layers': [
          {
            'type': 'cartodb',
            'options': {
              'source': {
                'id': 'layer1'
              },
              'cartocss': 'cartoCSS1',
              'cartocss_version': '2.0',
              'interactivity': []
            }
          },
          {
            'type': 'cartodb',
            'options': {
              'source': {
                'id': 'layer2'
              },
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': []
            }
          },
          {
            'type': 'cartodb',
            'options': {
              'source': {
                'id': 'layer3'
              },
              'cartocss': 'cartoCSS3',
              'cartocss_version': '2.0',
              'interactivity': []
            }
          }
        ],
        'dataviews': {},
        'analyses': [
          {
            'id': 'layer1',
            'type': 'source',
            'params': {
              'query': 'sql1'
            }
          },
          {
            'id': 'layer2',
            'type': 'source',
            'params': {
              'query': 'sql2'
            }
          },
          {
            'id': 'layer3',
            'type': 'source',
            'params': {
              'query': 'sql3'
            }
          }
        ]
      });
    });

    it('should not include hidden layers', function () {
      this.cartoDBLayer1.set('visible', false, { silent: true });
      this.cartoDBLayer3.set('visible', false, { silent: true });

      expect(this.map.toJSON()).toEqual({
        'layers': [
          {
            'type': 'cartodb',
            'options': {
              'source': {
                'id': 'layer2'
              },
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': []
            }
          }
        ],
        'dataviews': {},
        'analyses': [
          {
            'id': 'layer1',
            'type': 'source',
            'params': {
              'query': 'sql1'
            }
          },
          {
            'id': 'layer2',
            'type': 'source',
            'params': {
              'query': 'sql2'
            }
          },
          {
            'id': 'layer3',
            'type': 'source',
            'params': {
              'query': 'sql3'
            }
          }
        ]
      });
    });

    it('should include dataviews', function () {
      var dataview1 = new HistogramDataviewModel({
        id: 'dataviewId1',
        column: 'column1',
        bins: 5
      }, {
        map: jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']),
        windshaftMap: this.map,
        layer: this.cartoDBLayer1
      });

      var dataview2 = new HistogramDataviewModel({
        id: 'dataviewId2',
        column: 'column2',
        bins: 5
      }, {
        map: jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']),
        windshaftMap: this.map,
        layer: this.cartoDBLayer2
      });

      this.cartoDBLayer2.set('visible', false, { silent: true });

      this.dataviewsCollection.reset([ dataview1, dataview2 ]);

      expect(this.map.toJSON().dataviews).toEqual({
        'dataviewId1': {
          'type': 'histogram',
          'source': {
            'id': 'layer1'
          },
          'options': {
            'column': 'column1',
            'bins': 5
          }
        },
        'dataviewId2': {
          'type': 'histogram',
          'source': {
            'id': 'layer2'
          },
          'options': {
            'column': 'column2',
            'bins': 5
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
          map: jasmine.createSpyObj('map', ['reload'])
        });
      });

      it('should include analyses', function () {
        this.analysisFactory.analyse({
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
        this.cartoDBLayer1.update({
          source: 'c1',
          cartocss: '#trade_area { ... }'
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
          },
          {
            'id': 'layer2',
            'type': 'source',
            'params': {
              'query': 'sql2'
            }
          },
          {
            'id': 'layer3',
            'type': 'source',
            'params': {
              'query': 'sql3'
            }
          }
        ]);
      });

      it("should not include an analysis if it's part of the analysis of another layer", function () {
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

        expect(this.map.toJSON()).toEqual({
          'layers': [
            {
              'type': 'cartodb',
              'options': {
                'source': {
                  'id': 'c1'
                },
                'cartocss': '#union { ... }',
                'cartocss_version': '2.0',
                'interactivity': []
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'source': {
                  'id': 'a2'
                },
                'cartocss': '#union { ... }',
                'cartocss_version': '2.0',
                'interactivity': []
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'source': {
                  'id': 'layer3'
                },
                'cartocss': 'cartoCSS3',
                'cartocss_version': '2.0',
                'interactivity': []
              }
            }
          ],
          'dataviews': {},
          'analyses': [
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
            },
            {
              'id': 'layer3',
              'type': 'source',
              'params': {
                'query': 'sql3'
              }
            }
          ]
        });
      });
    });
  });
});
