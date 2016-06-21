# encoding: utf-8

require_relative '../../services/carto/visualizations_export_service_2'

module Carto
  class Mapcap < ActiveRecord::Base
    include Carto::VisualizationsExportService2Importer
    include Carto::VisualizationsExportService2Exporter

    belongs_to :visualization, class_name: Carto::Visualization, foreign_key: 'visualization_id'

    before_save :generate_export_json
    after_commit :invalidate_visualization_cache

    def regenerate_visualization
      regenerated_visualization = build_visualization_from_json_export(export_json)

      regenerated_visualization.id = visualization.id
      regenerated_visualization.user = visualization.user
      regenerated_visualization.map.user = visualization.user
      regenerated_visualization.map.layers.each do |layer|
        layer.id = SecureRandom.uuid
        layer.maps = [regenerated_visualization.map]

        layer.widgets.each_with_index do |widget, index|
          widget.id = index
          widget.layer_id = layer.id
        end
      end

      regenerated_visualization
    end

    private

    def generate_export_json
      self.export_json = export_visualization_json_string(visualization_id, visualization.user)
    end

    def invalidate_visualization_cache
      visualization.invalidate_cache
    end
  end
end
