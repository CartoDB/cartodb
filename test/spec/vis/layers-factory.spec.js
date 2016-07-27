var _ = require('underscore');

// required due to implicit dependency in vis --> map-view
var cdb = require('cdb');
_.extend(cdb.geo, require('../../../src/geo/leaflet'));
_.extend(cdb.geo, require('../../../src/geo/gmaps'));

var LayersFactory = require('../../../src/vis/layers-factory');

describe('vis/layers-factory', function () {
  beforeEach(function () {
    this.vis = jasmine.createSpyObj('vis', ['reload']);
  });

  describe('https/http', function () {
    it('torque layer should not rewrite to http if https is not present', function () {
      var layer = LayersFactory.create('torque', {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'carto.com',
        sql_api_protocol: 'https'
      }, { vis: this.vis });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(123);
    });

    it('torque layer should rewrite to https if the domain is not carto.com and https option is set to true', function () {
      var layer = LayersFactory.create('torque', {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'carto.com',
        sql_api_protocol: 'http'
      }, {
        https: true,
        vis: this.vis
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(443);
    });

    it('basemaps with a true explicit https property should be forced to https', function () {
      var layer = LayersFactory.create('tiled', {
        type: 'Tiled',
        urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
      }, {
        https: true,
        vis: this.vis
      });
      expect(layer.get('urlTemplate').indexOf('https')).not.toBe(-1);
    });
  });
});
