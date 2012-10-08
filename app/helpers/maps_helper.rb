module MapsHelper
  def map_vizzjson(map, options = {})
    options.reverse_merge! full: true

    CartoDB::Logger.info(map.inspect)
    {
      version: "0.1.0",

      layers: [
        layer_vizzjson(map.base_layers.first, options),
        layer_vizzjson(map.data_layers.first, options)
      ],

      overlays: [
        {
          type: "zoom",
          template: "mustache template"
        },
        {
          type: "header",
          shareable: true,
          url: table_url(map.tables.first)
        }
      ],

      description: map.tables.first.description,
      title: map.tables.first.name,

      map_provider: map.provider,

      center: map.center,
      zoom: map.zoom
    }
  end
end
