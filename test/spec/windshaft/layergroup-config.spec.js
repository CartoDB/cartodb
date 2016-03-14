var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var LayerGroupConfig = require('../../../src/windshaft/layergroup-config');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

describe('windshaft/layergroup-config', function () {
  beforeEach(function () {
    this.dataviews = new Backbone.Collection();
    var map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    var windshaftMap = jasmine.createSpyObj('windhsaftMap', ['bind']);

    this.cartoDBLayer1 = new CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    });
    var dataview = new HistogramDataviewModel({
      id: 'dataviewId',
      column: 'column1',
      bins: 10
    }, {
      map: map,
      windshaftMap: windshaftMap,
      layer: this.cartoDBLayer1
    });
    this.dataviews.add(dataview);

    this.cartoDBLayer2 = new CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    });
    var dataview2 = new HistogramDataviewModel({
      id: 'dataviewId2',
      column: 'column2',
      bins: 5
    }, {
      map: map,
      windshaftMap: windshaftMap,
      layer: this.cartoDBLayer2
    });
    this.dataviews.add(dataview2);

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
      }
    };

    this.analysisCollection = new Backbone.Collection();
    this.analysisFactory = new AnalysisFactory({
      analysisCollection: this.analysisCollection,
      camshaftReference: fakeCamshaftReference
    });
  });

  describe('.generate', function () {
    it('should include visible layers, analyses and dataviews', function () {
      var config = LayerGroupConfig.generate({
        dataviews: this.dataviews,
        layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ]
      });

      expect(config).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'layer1'
              },
              cartocss: 'cartoCSS1',
              cartocss_version: '2.0',
              interactivity: []
            }
          },
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'layer2'
              },
              cartocss: 'cartoCSS2',
              cartocss_version: '2.0',
              interactivity: []
            }
          }
        ],
        dataviews: {
          dataviewId: {
            type: 'histogram',
            source: {
              id: 'layer1'
            },
            options: {
              column: 'column1',
              bins: 10
            }
          },
          dataviewId2: {
            type: 'histogram',
            source: {
              id: 'layer2'
            },
            options: {
              column: 'column2',
              bins: 5
            }
          }
        },
        analyses: [
          {
            id: 'layer1',
            type: 'source',
            params: {
              query: 'sql1'
            }
          },
          {
            id: 'layer2',
            type: 'source',
            params: {
              query: 'sql2'
            }
          }
        ]
      });
    });

    it('should not include hidden layers', function () {
      this.cartoDBLayer1.set('visible', false, { silent: true });

      var config = LayerGroupConfig.generate({
        dataviews: this.dataviews,
        layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ]
      });

      expect(config).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'layer2'
              },
              cartocss: 'cartoCSS2',
              cartocss_version: '2.0',
              interactivity: []
            }
          }
        ],
        dataviews: {
          dataviewId: {
            type: 'histogram',
            source: {
              id: 'layer1'
            },
            options: {
              column: 'column1',
              bins: 10
            }
          },
          dataviewId2: {
            type: 'histogram',
            source: {
              id: 'layer2'
            },
            options: {
              column: 'column2',
              bins: 5
            }
          }
        },
        analyses: [
          {
            id: 'layer1',
            type: 'source',
            params: {
              query: 'sql1'
            }
          },
          {
            id: 'layer2',
            type: 'source',
            params: {
              query: 'sql2'
            }
          }
        ]
      });
    });

    it('should generate the right analyses for the different types of layers and analysis', function () {
      var dataviewsCollection = new Backbone.Collection();
      var layers = [];

      // t0 - create a new layer A with the subway stops dataset

      var layerModel = new CartoDBLayer({
        id: '11111',
        cartocss: '#subway_stops { ... }',
        sql: 'SELECT * FROM subway_stops'
      });
      layers.push(layerModel);

      var mapConfig = LayerGroupConfig.generate({
        layers: layers,
        dataviews: dataviewsCollection
      });

      expect(mapConfig).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              'source': { id: '11111' },
              'cartocss': '#subway_stops { ... }',
              'cartocss_version': '2.1.0',
              interactivity: []
            }
          }
        ],
        dataviews: {},
        analyses: [
          {
            'id': '11111',
            'type': 'source',
            'params': {
              query: 'SELECT * FROM subway_stops'
            }
          }
        ]
      });

      // t1 - add a trade area analysis to the layer A

      var analysis = this.analysisFactory.analyse({
        id: 'a1',
        type: 'trade-area',
        params: {
          source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'select * from subway_stops'
            }
          },
          kind: 'walk',
          time: 300
        }
      });

      layerModel.update({
        source: analysis,
        cartocss: '#trade_area { ... }'
      }, { silent: true });

      mapConfig = LayerGroupConfig.generate({
        layers: layers,
        dataviews: dataviewsCollection
      });

      expect(mapConfig).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              'source': { id: 'a1' },
              'cartocss': '#trade_area { ... }',
              'cartocss_version': '2.1.0',
              interactivity: []
            }
          }
        ],
        dataviews: {},
        analyses: [
          {
            id: 'a1',
            type: 'trade-area',
            params: {
              source: {
                id: 'a0',
                type: 'source',
                params: {
                  query: 'select * from subway_stops'
                }
              },
              kind: 'walk',
              time: 300
            }
          }
        ]
      });

      // t2 - add an estimated population analysis to the layer A

      analysis = this.analysisFactory.analyse({
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
                id: 'a0',
                type: 'source',
                params: {
                  query: 'select * from subway_stops'
                }
              }
            }
          }
        }
      });
      layerModel.update({
        source: analysis,
        cartocss: '#estimated_population { ... }'
      }, { silent: true });

      mapConfig = LayerGroupConfig.generate({
        layers: layers,
        dataviews: dataviewsCollection
      });

      expect(mapConfig).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              'source': { id: 'a2' },
              'cartocss': '#estimated_population { ... }',
              'cartocss_version': '2.1.0',
              interactivity: []
            }
          }
        ],
        dataviews: {},
        analyses: [
          {
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
                    id: 'a0',
                    type: 'source',
                    params: {
                      query: 'select * from subway_stops'
                    }
                  }
                }
              }
            }
          }
        ]
      });

      // t3 - create a new layer B from the layer A source (subway stops)

      var analysisNode = analysis.findAnalysisById('a0');
      analysisNode.set({
        id: 'b0'  // previously a0
      });

      var layerB = new CartoDBLayer({
        id: '22222',
        source: analysisNode,
        cartocss: '#subway_stops { ... }'
      });
      layers.push(layerB);

      mapConfig = LayerGroupConfig.generate({
        layers: layers,
        dataviews: dataviewsCollection
      });

      expect(mapConfig).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'a2'
              },
              cartocss: '#estimated_population { ... }',
              cartocss_version: '2.1.0',
              interactivity: []
            }
          },
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'b0'
              },
              cartocss: '#subway_stops { ... }',
              cartocss_version: '2.1.0',
              interactivity: []
            }
          }
        ],
        dataviews: {},
        analyses: [
          {
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
        ]
      });

      // t4 - create a new layer C and add a total population analysis (C1) using the estimated population analysis (A2) from layer A

      analysis = this.analysisFactory.analyse({
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
      var layerC = new CartoDBLayer({
        id: '33333',
        source: analysis,
        cartocss: '#total_population { ... }'
      });
      layers.push(layerC);

      mapConfig = LayerGroupConfig.generate({
        layers: layers,
        dataviews: dataviewsCollection
      });

      expect(mapConfig).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'a2'
              },
              cartocss: '#estimated_population { ... }',
              cartocss_version: '2.1.0',
              interactivity: []
            }
          },
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'b0'
              },
              cartocss: '#subway_stops { ... }',
              cartocss_version: '2.1.0',
              interactivity: []
            }
          },
          {
            type: 'cartodb',
            options: {
              source: {
                id: 'c1'
              },
              cartocss: '#total_population { ... }',
              cartocss_version: '2.1.0',
              interactivity: []
            }
          }
        ],
        dataviews: {},
        analyses: [
          {
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
          }
        ]
      });

      // t5 - wadus
    });

    it('should work with other types of analyses (eg: point-in-polygon)', function () {
      var dataviewsCollection = new Backbone.Collection();
      var layers = [];

      var analysis = this.analysisFactory.analyse({
        id: 'a1',
        type: 'point-in-polygon',
        params: {
          points_source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM cities'
            }
          },
          polygons_source: {
            id: 'a2',
            type: 'source',
            params: {
              query: 'SELECT * FROM states'
            }
          }
        }
      });

      var layerModel = new CartoDBLayer({
        id: '11111',
        cartocss: '#point-in-polygon { ... }',
        source: analysis
      });
      layers.push(layerModel);

      var mapConfig = LayerGroupConfig.generate({
        layers: layers,
        dataviews: dataviewsCollection
      });

      expect(mapConfig).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              'source': { id: 'a1' },
              'cartocss': '#point-in-polygon { ... }',
              'cartocss_version': '2.1.0',
              interactivity: []
            }
          }
        ],
        dataviews: {},
        analyses: [
          {
            id: 'a1',
            type: 'point-in-polygon',
            params: {
              points_source: {
                id: 'a0',
                type: 'source',
                params: {
                  query: 'SELECT * FROM cities'
                }
              },
              polygons_source: {
                id: 'a2',
                type: 'source',
                params: {
                  query: 'SELECT * FROM states'
                }
              }
            }
          }
        ]
      });
    });
  });
});
