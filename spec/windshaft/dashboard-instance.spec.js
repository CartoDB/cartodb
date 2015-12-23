var DashboardInstance = require('../../src/windshaft/dashboard-instance');

describe('windshaft/dashboard-instance', function () {
  describe('#getBaseURL', function () {
    it("should return Windshaft's url if no CDN info is present", function () {
      var dashboard = new DashboardInstance({
        layergroupid: '0123456789',
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo'
      });
      expect(dashboard.getBaseURL()).toEqual('https://rambo.example.com:443/api/v1/map/0123456789');
    });

    it('should return the CDN URL for http when CDN info is present', function () {
      var dashboard = new DashboardInstance({
        urlTemplate: 'http://{user}.example.com:80',
        userName: 'rambo',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        }
      });
      expect(dashboard.getBaseURL()).toEqual('http://cdn.http.example.com/rambo/api/v1/map/');
    });

    it('should return the CDN URL for https when CDN info is present', function () {
      var dashboard = new DashboardInstance({
        urlTemplate: 'https://{user}.example.com:80',
        userName: 'rambo',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        }
      });
      expect(dashboard.getBaseURL()).toEqual('https://cdn.https.example.com/rambo/api/v1/map/');
    });
  });

  describe('#getTiles', function () {
    it('should return the URLs for tiles and grids by default or when requesting "mapnik" layers', function () {
      var dashboard = new DashboardInstance({
        'layergroupid': '0123456789',
        'urlTemplate': 'https://{user}.example.com:443',
        'userName': 'rambo',
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
      });

      // No type specified
      expect(dashboard.getTiles()).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ]
        ]
      });

      // Request tiles for "mapnik" layers specifically
      expect(dashboard.getTiles('mapnik')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ]
        ]
      });
    });

    it('should return the URLs for tiles and grids for "torque" layers', function () {
      var dashboard = new DashboardInstance({
        'layergroupid': '0123456789',
        'urlTemplate': 'https://{user}.example.com:443',
        'userName': 'rambo',
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
      });

      // Request tiles for "torque" layers specifically
      expect(dashboard.getTiles('torque')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.json.torque' ],
        grids: []
      });
    });

    it('should handle layer indexes correctly when a layer type is specified', function () {
      var dashboard = new DashboardInstance({
        'layergroupid': '0123456789',
        'urlTemplate': 'https://{user}.example.com:443',
        'userName': 'rambo',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            },
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
      });

      // Request tiles for "mapnik" layers specifically (#0 and #2)
      expect(dashboard.getTiles('mapnik')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0,2/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ],
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/2/{z}/{x}/{y}.grid.json' ]
        ]
      });

      // Request tiles for "torque" layers specifically (#1 and #3)
      expect(dashboard.getTiles('torque')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/1,3/{z}/{x}/{y}.json.torque' ],
        grids: []
      });
    });

    describe('when NOT using a CDN', function () {
      it('should return the URLS for tiles and grids for https', function () {
        var dashboard = new DashboardInstance({
          'layergroupid': '0123456789',
          'urlTemplate': 'https://{user}.example.com:443',
          'userName': 'rambo',
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        });
        expect(dashboard.getTiles()).toEqual({
          tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png' ],
          grids: [
            [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ],
            [ 'https://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json' ]
          ]
        });
      });

      it('should return the URLS for tiles and grids for http', function () {
        var dashboard = new DashboardInstance({
          'layergroupid': '0123456789',
          'urlTemplate': 'http://{user}.example.com:443',
          'userName': 'rambo',
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        });
        expect(dashboard.getTiles()).toEqual({
          'tiles': [
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png'
          ],
          'grids': [
            [
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
            ], [
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
            ]
          ]
        });
      });
    });

    describe('when using a CDN', function () {
      it('should return the URLS for tiles and grids for https', function () {
        var dashboard = new DashboardInstance({
          'layergroupid': '0123456789',
          'urlTemplate': 'https://{user}.example.com:443',
          'userName': 'rambo',
          'cdn_url': {
            http: 'cdn.http.example.com',
            https: 'cdn.https.example.com'
          },
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        });
        expect(dashboard.getTiles()).toEqual({
          'tiles': [ 'https://cdn.https.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png' ],
          'grids': [
            [ 'https://cdn.https.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ],
            [ 'https://cdn.https.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json' ]
          ]
        });
      });

      it('should return the URLS for tiles and grids for http', function () {
        var dashboard = new DashboardInstance({
          'layergroupid': '0123456789',
          'urlTemplate': 'http://{user}.example.com:443',
          'userName': 'rambo',
          'cdn_url': {
            http: 'cdn.http.example.com',
            https: 'cdn.https.example.com'
          },
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        });
        expect(dashboard.getTiles()).toEqual({
          'tiles': [
            'http://0.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://1.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://2.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://3.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png'
          ],
          'grids': [
            [
              'http://0.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://1.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://2.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://3.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
            ], [
              'http://0.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://1.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://2.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://3.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
            ]
          ]
        });
      });
    });
  });

  describe('#getDataviewURL', function () {
    it('should return undefined if dataview is not found', function () {
      var dashboard = new DashboardInstance({
        'layergroupid': '0123456789',
        'urlTemplate': 'https://{user}.example.com:443',
        'userName': 'rambo',
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
      });

      var dataviewURL = dashboard.getDataviewURL({ dataviewId: 'whatever', protocol: 'http' });
      expect(dataviewURL).toBeUndefined();

      dashboard = new DashboardInstance({
        'layergroupid': '0123456789',
        'urlTemplate': 'https://{user}.example.com:443',
        'userName': 'rambo',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {},
              'widgets': {
                'category_widget_uuid': {
                  'url': {
                    'http': 'http://staging.cartocdn.com/pablo/api/v1/map/a5a4f259c7a6af8b56a182ad1b1635f7:1446650335533.2698/0/widget/category_widget_uuid',
                    'https': 'https://cdb-staging-1.global.ssl.fastly.net/pablo/api/v1/map/a5a4f259c7a6af8b56a182ad1b1635f7:1446650335533.2698/0/widget/category_widget_uuid'
                  }
                }
              }
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      });

      dataviewURL = dashboard.getDataviewURL({ dataviewId: 'whatever', protocol: 'http' });
      expect(dataviewURL).toBeUndefined();
    });

    it('should return the URL for the given dataviewId and protocol', function () {
      var dashboard = new DashboardInstance({
        'layergroupid': '0123456789',
        'urlTemplate': 'https://{user}.example.com:443',
        'userName': 'rambo',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {},
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
              'meta': {}
            }
          ]
        }
      });

      var dataviewURL = dashboard.getDataviewURL({ dataviewId: 'dataviewId', protocol: 'http' });
      expect(dataviewURL).toEqual('http://example.com');

      dataviewURL = dashboard.getDataviewURL({ dataviewId: 'dataviewId', protocol: 'https' });
      expect(dataviewURL).toEqual('https://example.com');
    });
  });
});
