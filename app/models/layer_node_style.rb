class LayerNodeStyle < Sequel::Model
  many_to_one :layer

  plugin :serialization, :json, :options, :infowindow, :tooltip

  OPTIONS_TO_COPY = [:sql_wrap, :style_properties, :tile_style].freeze

  def duplicate
    lns = LayerNodeStyle.new(source_id: source_id)
    lns.infowindow = infowindow
    lns.tooltip = tooltip
    lns.options = options
    lns.simple_geom = simple_geom
    lns
  end

  def update_from_layer
    self.infowindow = layer.infowindow
    self.tooltip = layer.tooltip
    self.options = layer.options.symbolize_keys.slice(*OPTIONS_TO_COPY)

    vis = layer.visualization
    node = Carto::AnalysisNode.find_by_natural_id(vis.id, source_id) if vis
    simple_geom = node.options[:simple_geom] if node && node.options
    self.simple_geom = simple_geom if simple_geom.present?
  end
end
