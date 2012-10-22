describe('common', function() {

  var common;

  beforeEach(function() {
    common = new CartoDBLayerCommon();
  });

  it("should use cdn_url as default", function() {
    common.options = {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo'
    }

    expect(common._host()).toEqual('http://tiles.cartocdn.com/rambo');
    expect(common._host('0')).toEqual('http://0.tiles.cartocdn.com/rambo');
    common.options.tiler_protocol = "https";
    expect(common._host()).toEqual('https://d3pu9mtm6f0hk5.cloudfront.net/rambo');
    expect(common._host('a')).toEqual('https://a.d3pu9mtm6f0hk5.cloudfront.net/rambo');
  });

  it("should use cdn_url as default", function() {
    common.options = {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      no_cdn: true
    }


    expect(common._host()).toEqual('http://rambo.cartodb.com:8081');
    expect(common._host('0')).toEqual('http://rambo.cartodb.com:8081');
    common.options.tiler_protocol = "https";
    expect(common._host()).toEqual('https://rambo.cartodb.com:8081');
    expect(common._host('0')).toEqual('https://rambo.cartodb.com:8081');
  });

});
