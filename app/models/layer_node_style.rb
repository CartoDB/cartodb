class LayerNodeStyle < Sequel::Model
  many_to_one :layer

  plugin :serialization, :json, :options, :infowindow, :tooltip

  OPTIONS_TO_COPY = [:sql_wrap, :style_properties, :tile_style].freeze

  def update_from_layer(layer)
    self.infowindow = layer.infowindow || {}
    self.tooltip = layer.tooltip || {}
    self.options = layer.options.symbolize_keys.slice(*OPTIONS_TO_COPY)
  end
end
