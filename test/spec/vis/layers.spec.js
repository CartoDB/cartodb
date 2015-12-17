var $ = require('jquery');
var _ = require('underscore');

// required due to implicit dependency in vis --> map-view
var cdb = require('cdb');
_.extend(cdb.geo, require('../../../src/geo/leaflet'));
_.extend(cdb.geo, require('../../../src/geo/gmaps'));

var Vis = require('../../../src/vis/vis');
var Layers = require('../../../src/vis/vis/layers');
require('../../../src/vis/layers'); // Layers.register calls

describe('vis/layers', function() {
  var vis;
  beforeEach(function() {
    vis = new Vis({});
  });

  describe('https/http', function() {

    it("torque layer should not rewrite to http if vis is not forced to https", function() {
      var layer = Layers.create('torque', vis, {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'cartodb.com',
        sql_api_protocol: 'https'
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(123);
    });

    it("torque layer should rewrite to https if the domain is not cartodb.com and is forced", function() {
      vis.https = true;
      var layer = Layers.create('torque', vis, {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'cartodb.com',
        sql_api_protocol: 'http'
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(443);
    });

    it("basemaps with a true explicit https property should be forced to https", function() {
      vis.https = true;
      var layer = Layers.create('tiled', vis, {
        type: 'Tiled',
        urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
      });
      expect(layer.get('urlTemplate').indexOf('https')).not.toBe(-1);
    })

  });
});
