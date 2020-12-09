require_dependency 'carto/carto_json_serializer'

module Carto
  class LayerNodeStyle < ActiveRecord::Base

    belongs_to :layer

    serialize :options, CartoJsonSymbolizerSerializer
    serialize :infowindow, CartoJsonSymbolizerSerializer
    serialize :tooltip, CartoJsonSymbolizerSerializer

    OPTIONS_TO_COPY = [:sql_wrap, :style_properties, :tile_style].freeze

    def self.from_visualization_and_source(visualization, source_id)
      Carto::LayerNodeStyle.where(layer_id: visualization.data_layers.map(&:id), source_id: source_id)
    end

    def update_from_layer(layer)
      self.infowindow = layer.infowindow || {}
      self.tooltip = layer.tooltip || {}
      self.options = layer.options.symbolize_keys.slice(*OPTIONS_TO_COPY)
    end

  end
end
