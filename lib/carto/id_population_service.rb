# encoding utf-8

module Carto
  module IDPopulationSerivce
    def ids_json_for_visualization(visualization)
      layers_hash = visualization.layers.map do |layer|
        { layer_id: layer.id, widgets: layer.widgets(&:id) }
      end

      {
        visualization_id: visualization.id,
        map_id: visualization.map.id,
        layers: layers_hash
      }
    end
  end
end
