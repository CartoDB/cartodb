
describe('vis.layers', function() {
  var vis;
  beforeEach(function() {
    vis = new cdb.vis.Vis({});
  });

  describe('https/http', function() {

    it("torque layer should not rewrite to http if vis is not forced to https", function() {
      var layer = cdb.vis.Layers.create('torque', vis, {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'carto.com',
        sql_api_protocol: 'https'
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(123);
    });

    it("torque layer should rewrite to https if the domain is not carto.com and is forced", function() {
      vis.https = true;
      var layer = cdb.vis.Layers.create('torque', vis, {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'carto.com',
        sql_api_protocol: 'http'
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(443);
    });

    it("basemaps with a true explicit https property should be forced to https", function() {
      vis.https = true;
      var layer = cdb.vis.Layers.create('tiled', vis, {
        type: 'Tiled',
        urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
      });
      expect(layer.get('urlTemplate').indexOf('https')).not.toBe(-1);
    })

  });
});
