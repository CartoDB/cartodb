describe("LayerDefinition", function() {
  var layerDefinition;
  beforeEach(function(){
    var  layer_definition = {
      version: '1.0.0',
      layers: [{
         type: 'cartodb', 
         options: {
           sql: 'select * from ne_10m_populated_places_simple',
           cartocss: '#layer { marker-fill: red; }', 
         }
       }, {
         type: 'cartodb', 
         options: {
           sql: "select * from european_countries_export",
           cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}'
         }
       }
      ]
    }
    layerDefinition = new LayerDefinition(layer_definition, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      table_name: 'test',
    });

  });

  it("should return layer count", function() {
    expect(layerDefinition.getLayerCount()).toEqual(2);
  });

  it("should remove a layer", function() {
    layerDefinition.removeLayer(0);
    expect(layerDefinition.getLayerCount()).toEqual(1);
    expect(layerDefinition.getLayer(0)).toEqual({
       type: 'cartodb', 
       options: {
         sql: "select * from european_countries_export",
         cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}'
       }
    });
  });

  it("should add a layer", function() {
    layerDefinition.addLayer({ sql : 'b', cartocss: 'b'});
    expect(layerDefinition.getLayerCount()).toEqual(3);
    expect(layerDefinition.getLayer(2)).toEqual({
       type: 'cartodb', 
       options: {
         sql: 'b',
         cartocss: 'b'
       }
    });
    layerDefinition.addLayer({ sql : 'a', cartocss: 'a'}, 0);
    expect(layerDefinition.getLayer(0)).toEqual({
       type: 'cartodb', 
       options: {
         sql: "a",
         cartocss: 'a'
       }
    });
  });

  it("should return json spec of layers", function() {
    expect(layerDefinition.toJSON()).toEqual({
      version: '1.0.0',
      layers: [{
         type: 'cartodb', 
         options: {
           sql: 'select * from ne_10m_populated_places_simple',
           cartocss: '#layer { marker-fill: red; }', 
         }
       }, {
         type: 'cartodb', 
         options: {
           sql: "select * from european_countries_export",
           cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}'
         }
       }
      ]
    });
  });

  it("should return tiles", function() {
  });

});

