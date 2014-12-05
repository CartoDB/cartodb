
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
        sql_api_domain: 'cartodb.com',
        sql_api_protocol: 'https'
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(123);
    });

    it("torque layer should rewrite to https if the domain is not cartodb.com and is forced", function() {
      vis.https = true;
      var layer = cdb.vis.Layers.create('torque', vis, {
        type: 'torque',
        sql_api_port: 123,
        sql_api_domain: 'cartodb.com',
        sql_api_protocol: 'http'
      });
      expect(layer.get('sql_api_protocol')).toEqual('https');
      expect(layer.get('sql_api_port')).toEqual(443);
    });

  });
});
