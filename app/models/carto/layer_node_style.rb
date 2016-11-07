require_dependency 'carto/carto_json_serializer'

module Carto
  class LayerNodeStyle < ActiveRecord::Base
    belongs_to :layer

    serialize :options, CartoJsonSymbolizerSerializer
    serialize :infowindow, CartoJsonSymbolizerSerializer
    serialize :tooltip, CartoJsonSymbolizerSerializer

    def self.from_visualization_and_source(visualization, source_id)
      Carto::LayerNodeStyle.where(layer_id: visualization.data_layers.map(&:id), source_id: source_id)
    end
  end
end
