var Response = require('../../../src/windshaft/response');

describe('windshaft-response', function () {
  describe('.getLayerMetadata', function () {
    it('should return the metadata given an index', function () {
      var windshaftSettings = {};
      var serverResponse = {
        layergroupid: 'layergroupid',
        metadata: {
          layers: [
            {
              'type': 'mapnik',
              'meta': 'cartodb-metadata',
              'widgets': {
                'dataviewId': {
                  'url': {
                    'http': 'http://example.com',
                    'https': 'https://example.com'
                  }
                }
              }
            },
            {
              'type': 'torque',
              'meta': 'torque-metadata'
            }
          ]
        }
      };
      var response = new Response(windshaftSettings, serverResponse);

      expect(response.getLayerMetadata(0)).toEqual('cartodb-metadata');
      expect(response.getLayerMetadata(1)).toEqual('torque-metadata');
    });
  });

  describe('.getBaseURL', function () {
    it("should return Windshaft's url if no CDN info is present", function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        layergroupid: '0123456789',
        metadata: {}
      };
      var response = new Response(windshaftSettings, serverResponse);

      expect(response.getBaseURL()).toEqual('https://cartojs-test.carto.com/api/v1/map/0123456789');
    });

    it('should return the CDN URL for HTTP when CDN info is present', function () {
      var windshaftSettings = {
        urlTemplate: 'http://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        },
        metadata: {}
      };
      var response = new Response(windshaftSettings, serverResponse);

      expect(response.getBaseURL()).toEqual('http://cdn.http.example.com/cartojs-test/api/v1/map/0123456789');
    });

    it('should return the CDN URL for HTTPS when CDN info is present', function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        },
        metadata: {}
      };
      var response = new Response(windshaftSettings, serverResponse);

      expect(response.getBaseURL()).toEqual('https://cdn.https.example.com/cartojs-test/api/v1/map/0123456789');
    });

    it('should use the CDN template', function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn1.http.example.com',
          https: 'cdn1.https.example.com',
          templates: {
            http: {
              url: 'http://{s}.cdn2.http.example.com',
              subdomains: ['0', '1', '2']
            },
            https: {
              url: 'https://{s}.cdn2.https.example.com',
              subdomains: ['0', '1', '2']
            }
          }
        },
        metadata: {}
      };
      var response = new Response(windshaftSettings, serverResponse);

      var expected = 'https://{s}.cdn2.https.example.com/cartojs-test/api/v1/map/0123456789';
      var actual = response.getBaseURL();
      expect(actual).toEqual(expected);
    });
  });

  describe('.getDataviewMetadata', function () {
    it('should return undefined if dataviews key is not present in the metadata', function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      };
      var response = new Response(windshaftSettings, serverResponse);

      var dataviewMetadata = response.getDataviewMetadata('whatever');
      expect(dataviewMetadata).toBeUndefined();
    });

    it('should return the URL for the given dataviewId when metadata is under dataview', function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        layergroupid: '0123456789',
        metadata: {
          layers: [
            {
              type: 'mapnik',
              meta: {}
            },
            {
              type: 'torque',
              meta: {}
            }
          ],
          dataviews: {
            dataviewId: {
              url: {
                http: 'http://example.com',
                https: 'https://example.com'
              }
            },
            dataviewId2: {
              url: {
                http: 'http://example2.com',
                https: 'https://example2.com'
              }
            }
          }
        }
      };
      var response = new Response(windshaftSettings, serverResponse);

      var dataviewMetadata = response.getDataviewMetadata('dataviewId');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example.com',
          'https': 'https://example.com'
        }
      });

      dataviewMetadata = response.getDataviewMetadata('dataviewId2');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example2.com',
          'https': 'https://example2.com'
        }
      });
    });

    it('should return the URL for the given dataviewId when metadata is under layers', function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        'layergroupid': 'observatory@2168bf86@a71df05e422879e95930bbcb932a9b0a:1460751254653',
        'metadata': {
          'layers': [
            {
              'type': 'http',
              'meta': {
                'stats': [],
                'cartocss': {}
              }
            },
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': '/** choropleth visualization */\n\n\n@1 : #5C308C;\n@2 : #833599;\n@3 : #A640A2;\n@4 : #C753A8; \n@5 : #e76cac;\n@6 : #ff8db1  ;\n@7 : #ffc2c7  ;\n\n\n#5C308C,#833599,#A640A2,#C753A8,#E76CAC,#FF8DB1,#FFC2C7\n\n\n#segregated_tracts{\n  polygon-fill: #FFFFB2;\n  polygon-opacity: 0.8;\n}\n#segregated_tracts [ prob_being_same <= 1] {\n   polygon-fill: @7;\n   line-color: lighten(@7,5);\n}\n#segregated_tracts [ prob_being_same <= 0.900302811812] {\n   polygon-fill: @6;\n   line-color: lighten(@6,5);\n}\n#segregated_tracts [ prob_being_same <= 0.807340578641] {\n   polygon-fill: @5;\n   line-color: lighten(@5,5);\n}\n#segregated_tracts [ prob_being_same <= 0.69976803713] {\n   polygon-fill: @4;\n   line-color: lighten(@4,5);\n}\n#segregated_tracts [ prob_being_same <= 0.588361334051] {\n   polygon-fill: @3;\n   line-color: lighten(@3,5);\n}\n#segregated_tracts [ prob_being_same <= 0.487706534839] {\n   polygon-fill: @2;\n   line-color: lighten(@2,5);\n}\n#segregated_tracts [ prob_being_same <= 0.399914994417] {\n   polygon-fill: @1;\n   line-color: lighten(@1,5);\n}'
              },
              'widgets': {
                'dataviewId': {
                  'url': {
                    'http': 'http://example.com',
                    'https': 'https://example.com'
                  }
                },
                'dataviewId2': {
                  'url': {
                    'http': 'http://example2.com',
                    'https': 'https://example2.com'
                  }
                }
              }
            },
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': '/** simple visualization */\n\n#us_census_tiger2013_state{\n  polygon-fill: #FF6600;\n  polygon-opacity: 0;\n  line-color: #FFF;\n  line-width: 1;\n  line-opacity: 1;\n}'
              }
            },
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': '/** simple visualization */\n\n#detailed_water{\n  polygon-fill: #CDD2D4;\n  polygon-opacity: 1;\n  line-color: #CDD2D4;\n  line-width: 0.5;\n  line-opacity: 1;\n}'
              }
            },
            {
              'type': 'http',
              'meta': {
                'stats': [],
                'cartocss': {}
              }
            }
          ],
          'dataviews': {},
          'analyses': []
        },
        'cdn_url': {
          'http': 'ashbu.cartocdn.com',
          'https': 'cartocdn-ashbu.global.ssl.fastly.net'
        },
        'last_updated': '2016-04-15T20:14:14.653Z'
      };
      var response = new Response(windshaftSettings, serverResponse);

      var dataviewMetadata = response.getDataviewMetadata('dataviewId');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example.com',
          'https': 'https://example.com'
        }
      });

      dataviewMetadata = response.getDataviewMetadata('dataviewId2');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example2.com',
          'https': 'https://example2.com'
        }
      });
    });
  });

  describe('.getAnalysesMedatada', function () {
    it('should return undefined when there are no analyses', function () {
      var windshaftSettings = {};
      var serverResponse = {
        'metadata': {
          'layers': [],
          'dataviews': {},
          'analyses': []
        }
      };

      var response = new Response(windshaftSettings, serverResponse);

      var analysisMetadata = response.getAnalysisNodeMetadata('fakeId');
      expect(analysisMetadata).toBeUndefined();
    });

    it('should return the analysis metadata when exists', function () {
      var windshaftSettings = {};
      var serverResponse = {
        'metadata': {
          'layers': [],
          'dataviews': {},
          'analyses': [
            {
              'nodes': {
                'a0': {
                  'status': 'ready',
                  'url': {
                    'http': 'http://3.ashbu.cartocdn.com/iago-carto/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/analysis/node/dc2b9be10f88baa5b0156f2530f9b978b47a2a23',
                    'https': 'https://cartocdn-ashbu_d.global.ssl.fastly.net/iago-carto/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/analysis/node/dc2b9be10f88baa5b0156f2530f9b978b47a2a23'
                  },
                  'query': 'SELECT * FROM table'
                }
              }
            }
          ]
        }
      };
      var response = new Response(windshaftSettings, serverResponse);
      var analysisMetadata = response.getAnalysisNodeMetadata('a0');

      expect(analysisMetadata).toBeDefined();
      expect(analysisMetadata.status).toEqual('ready');
      expect(analysisMetadata.query).toEqual('SELECT * FROM table');
    });
  });

  describe('.getSupportedSubdomains', function () {
    var response;
    beforeEach(function () {
      var windshaftSettings = {
        urlTemplate: 'https://{user}.carto.com',
        userName: 'cartojs-test'
      };
      var serverResponse = {
        layergroupid: '0123456789',
        cdn_url: {
          templates: {
            http: {
              url: 'http://cdn.carto.com',
              subdomains: ['a', 'b']
            },
            https: {
              url: 'http://cdn.carto.com',
              subdomains: ['c', 'd']
            }
          }
        },
        metadata: {}
      };
      response = new Response(windshaftSettings, serverResponse);
    });

    it('should return supported subdomains if urlTemplate uses HTTP', function () {
      response._windshaftSettings.urlTemplate = 'http://{username}.carto.com';
      expect(response.getSupportedSubdomains()).toEqual(['a', 'b']);
    });

    it('should return not subdomains if urlTemplate uses HTTPS', function () {
      response._windshaftSettings.urlTemplate = 'https://{username}.carto.com';
      expect(response.getSupportedSubdomains()).toEqual(['c', 'd']);
    });
  });
});
