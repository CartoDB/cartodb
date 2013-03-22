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

  it("when query_wrapper is present the query should be wrapped", function() {
    common.options = {
      table_name: 'test',
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      tile_style:   "TEST",
      query: 'select jaja',
      query_wrapper: 'select * from (<%=sql%>)',
      tile_style: '#test { polygon-fill: red; }',
      interactivity: 'jaja'
    }
    var t = common._getLayerDefinition();
    expect(t.sql).toEqual('select * from (select jaja)');
    expect(t.cartocss).toEqual('#layer0 { polygon-fill: red; }');
    expect(t.interactivity).toEqual('jaja');
    
    common.options = {
      table_name: 'test',
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      tile_style:   "TEST",
      query: null,
      query_wrapper: 'select * from (<%=sql%>)'
    };
    t = common._getLayerDefinition();
    expect(t.sql).toEqual('select * from (select * from test)');
  });




});
