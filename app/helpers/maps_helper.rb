module MapsHelper
  def map_vizzjson(map)
    {
      version: "0.1.0",

      layers: [
        layer_vizzjson(map.base_layers.first),
        layer_vizzjson(map.data_layers.first)
      ],

      overlays: [
        {
          type: "zoom",
          template: "mustache template"
        },
        {
          type: "header",
          shareable: true,
          url: table_url(map.table)
        }
      ],

      description: map.table.description,
      title: map.table.name,

      map_provider: map.provider,

      center: map.center,
      zoom: map.zoom
    }
  end
end
