var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
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

    this.modelUpdater = jasmine.createSpyObj('modelUpdater', ['updateModels']);

    this.dataviewsCollection = new Backbone.Collection();
    this.layersCollection = new Backbone.Collection([this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3]);
    this.map = new AnonymousMap({}, {
      client: this.client,
      modelUpdater: this.modelUpdater,
      statTag: 'stat_tag',
      dataviewsCollection: this.dataviewsCollection,
      layersCollection: this.layersCollection,
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
              'cartocss': 'cartoCSS1',
              'cartocss_version': '2.0',
              'interactivity': [],
              'sql': 'sql1'
            }
          },
          {
            'type': 'cartodb',
            'options': {
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': [],
              'sql': 'sql2'
            }
          },
          {
            'type': 'cartodb',
            'options': {
              'cartocss': 'cartoCSS3',
              'cartocss_version': '2.0',
              'interactivity': [],
              'sql': 'sql3'
            }
          }
        ],
        'dataviews': {},
        'analyses': []
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
              'sql': 'sql2',
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': []
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
        'type': 'cartodb',
        'options': {
          'cartocss': 'cartoCSS1',
          'cartocss_version': '2.0',
          'interactivity': [],
          'sql': 'sql1',
          'sql_wrap': 'sql_wrap_1'
        }
      });
    });

    it('should include the interactiviy and attributes options for layers that have infowindow with fields', function () {
      this.cartoDBLayer1.infowindow.fields.add({ name: 'something' });

      expect(this.map.toJSON()).toEqual({
        'layers': [
          {
            'type': 'cartodb',
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
            'type': 'cartodb',
            'options': {
              'cartocss': 'cartoCSS2',
              'cartocss_version': '2.0',
              'interactivity': [],
              'sql': 'sql2'
            }
          },
          {
            'type': 'cartodb',
            'options': {
              'cartocss': 'cartoCSS3',
              'cartocss_version': '2.0',
              'interactivity': [],
              'sql': 'sql3'
            }
          }
        ],
        'dataviews': {},
        'analyses': []
      });
    });

    it('should NOT include interactivity and attributes options for "torque" layers', function () {
      this.layersCollection.reset(new TorqueLayer({
        sql: 'sql',
        cartocss: 'cartocss'
      }));

      expect(this.map.toJSON()).toEqual({
        'layers': [
          {
            'type': 'torque',
            'options': {
              'sql': 'sql',
              'cartocss': 'cartocss',
              'cartocss_version': '2.1.0',
              'interactivity': []
            }
          }
        ],
        'dataviews': {},
        'analyses': []
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

        expect(this.map.toJSON()).toEqual({
          'layers': [
            {
              'type': 'cartodb',
              'options': {
                'cartocss': '#trade_area { ... }',
                'cartocss_version': '2.0',
                'interactivity': [],
                'source': {
                  'id': 'c1'
                }
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'cartocss': 'cartoCSS2',
                'cartocss_version': '2.0',
                'interactivity': [],
                'sql': 'sql2'
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'cartocss': 'cartoCSS3',
                'cartocss_version': '2.0',
                'interactivity': [],
                'sql': 'sql3'
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
            }
          ]
        });
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
                'cartocss': '#union { ... }',
                'cartocss_version': '2.0',
                'interactivity': [],
                'source': {
                  'id': 'c1'
                }
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'cartocss': '#union { ... }',
                'cartocss_version': '2.0',
                'interactivity': [],
                'source': {
                  'id': 'a2'
                }
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'cartocss': 'cartoCSS3',
                'cartocss_version': '2.0',
                'interactivity': [],
                'sql': 'sql3'
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
            }
          ]
        });
      });

      it('should include a source analysis if a dataview is linked to the layer', function () {
        var dataview1 = new HistogramDataviewModel({
          id: 'dataviewId1',
          column: 'column1',
          bins: 5
        }, {
          map: jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']),
          windshaftMap: this.map,
          layer: this.cartoDBLayer1
        });

        this.dataviewsCollection.reset([ dataview1 ]);

        expect(this.map.toJSON()).toEqual({
          'layers': [
            {
              'type': 'cartodb',
              'options': {
                'cartocss': 'cartoCSS1',
                'cartocss_version': '2.0',
                'interactivity': [],
                'source': {
                  'id': 'layer1'
                }
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'cartocss': 'cartoCSS2',
                'cartocss_version': '2.0',
                'interactivity': [],
                'sql': 'sql2'
              }
            },
            {
              'type': 'cartodb',
              'options': {
                'cartocss': 'cartoCSS3',
                'cartocss_version': '2.0',
                'interactivity': [],
                'sql': 'sql3'
              }
            }
          ],
          'dataviews': {
            'dataviewId1': {
              'type': 'histogram',
              'source': {
                'id': 'layer1'
              },
              'options': {
                'column': 'column1',
                'bins': 5
              }
            }
          },
          'analyses': [{
            id: 'layer1',
            type: 'source',
            params: {
              query: 'sql1'
            }
          }]
        });
      });
    });
  });
});
