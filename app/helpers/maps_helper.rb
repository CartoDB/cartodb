module MapsHelper
  def map_vizzjson(map, options = {})
    options.reverse_merge! full: true

    bounds = JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]") rescue []

    CartoDB::Logger.info(map.inspect)
    {
      version: "0.1.0",

      updated_at: Time.now,

      layers: [
        layer_vizzjson(map.base_layers.first, options),
        layer_vizzjson(map.data_layers.first, options)
      ],

      overlays: [
        {
          type: "zoom",
          template: '<a class="zoom_in">+</a><a class="zoom_out">-</a>'
        },
        {
          type: "loader",
          template: '<div class="loader"></div>'
        }
      ],

      description: map.tables.first.description,
      title: map.tables.first.name,

      url: table_path(map.tables.first),

      map_provider: map.provider,

      bounds: (bounds.blank? ? nil : bounds),
      center: map.center,
      zoom: map.zoom
    }
  end
end
