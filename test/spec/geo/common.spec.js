describe('common', function() {

  var common;

  beforeEach(function() {
    common = new CartoDBLayerCommon();
    common.options = {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      table_name: 'test'
    }
  });

  it("should use cdn_url as default", function() {

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

  it("should use multiple hosts when use http", function() {
    var t = common._tileJSON();
    expect(t.tiles.length).toEqual(4);
    expect(t.grids.length).toEqual(4);
    expect(t.tiles[0]).toEqual('http://0.tiles.cartocdn.com/rambo/tiles/test/{z}/{x}/{y}.png?');
    expect(t.grids[0]).toEqual('http://0.tiles.cartocdn.com/rambo/tiles/test/{z}/{x}/{y}.grid.json?');

    common.options.tiler_protocol = "https";
    var t = common._tileJSON();
    expect(t.tiles.length).toEqual(1);
    expect(t.tiles[0]).toEqual('https://' + cdb.CDB_HOST['https'] + '/rambo/tiles/test/{z}/{x}/{y}.png?');
    expect(t.grids[0]).toEqual('https://' + cdb.CDB_HOST['https'] + '/rambo/tiles/test/{z}/{x}/{y}.grid.json?');
  });

  it("subdomains options should taken into account", function() {
    common.options.subdomains = ['a', 'b'];
    var t = common._tileJSON();
    expect(t.tiles.length).toEqual(2);
    expect(t.tiles[0]).toEqual('http://a.tiles.cartocdn.com/rambo/tiles/test/{z}/{x}/{y}.png?');
    expect(t.tiles[1]).toEqual('http://b.tiles.cartocdn.com/rambo/tiles/test/{z}/{x}/{y}.png?');
  });

  it("when use_server_style is true inline styles should not be used", function() {
    common.options = {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      tile_style:   "TEST",
      use_server_style: true
    }
    var t = common._tileJSON();
    expect(t.tiles[0].indexOf('style')).toEqual(-1);
    expect(t.grids[0].indexOf('style')).toEqual(-1);

    common.options = {
      tile_style:   "TEST",
      use_server_style: false
    }

    t = common._tileJSON();
    expect(t.tiles[0].indexOf('style')).not.toEqual(-1);
    expect(t.grids[0].indexOf('style')).not.toEqual(-1);


  });

  it("when query_wrapper is present the query should be wrapped", function() {
    common.options = {
      table_name: 'test',
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      tile_style:   "TEST",
      query: 'select jaja',
      query_wrapper: 'select * from (<%=sql%>)'
    }
    var t = common._tileJSON();
    expect(t.tiles[0].indexOf('sql='+encodeURIComponent('select * from (select jaja)'))).not.toEqual(-1);
    expect(t.grids[0].indexOf('sql='+encodeURIComponent('select * from (select jaja)'))).not.toEqual(-1);
    
    common.options = {
      table_name: 'test',
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      tile_style:   "TEST",
      query: null,
      query_wrapper: 'select * from (<%=sql%>)'
    }
    var t = common._tileJSON();
    expect(t.tiles[0].indexOf('sql='+encodeURIComponent('select * from (select * from test)'))).not.toEqual(-1);
    expect(t.grids[0].indexOf('sql='+encodeURIComponent('select * from (select * from test)'))).not.toEqual(-1);
  });

});
