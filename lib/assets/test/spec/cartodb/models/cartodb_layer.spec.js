describe("cdb.admin.CartoDBLayer", function() {

  describe('.toLayerGroup', function() {

    it('should clone the attributes and set the layer definition', function() {
      var layer = new cdb.admin.CartoDBLayer({
        table_name: 'table_name',
        tile_style: 'tile_style',
        interactivity: 'interactivity',
        visible: true
      });

      var layerGroup = layer.toLayerGroup();

      expect(layerGroup.table_name).toEqual('table_name');
      expect(layerGroup.type).toEqual('layergroup');
      expect(layerGroup.layer_definition).toEqual({
        version: '1.0.1',
        layers: [
          {
            type: 'cartodb',
            options: {
              sql: 'select * from table_name',
              cartocss: 'tile_style',
              cartocss_version: '2.1.1',
              interactivity: 'interactivity'
            }
          }
        ]
      });
    })

    it('should clone the attributes and set the layer definition quoting the table name if needed', function() {
      var layer = new cdb.admin.CartoDBLayer({
        table_name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
        tile_style: 'tile_style',
        interactivity: 'interactivity',
        visible: true
      });

      var layerGroup = layer.toLayerGroup();

      expect(layerGroup.table_name).toEqual('000cd294-b124-4f82-b569-0f7fe41d2db8');
      expect(layerGroup.type).toEqual('layergroup');
      expect(layerGroup.layer_definition).toEqual({
        version: '1.0.1',
        layers: [
          {
            type: 'cartodb',
            options: {
              sql: 'select * from "000cd294-b124-4f82-b569-0f7fe41d2db8"',
              cartocss: 'tile_style',
              cartocss_version: '2.1.1',
              interactivity: 'interactivity'
            }
          }
        ]
      });
    })

    it('should not include the layer in the layer definition if is not visible', function() {
      var layer = new cdb.admin.CartoDBLayer({
        visible: false
      });

      var layerGroup = layer.toLayerGroup();

      expect(layerGroup.layer_definition).toEqual({
        version: '1.0.1',
        layers: []
      });
    })
  })
});
