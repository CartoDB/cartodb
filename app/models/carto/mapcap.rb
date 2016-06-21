# encoding: utf-8

require_relative '../../services/carto/visualizations_export_service_2'

module Carto
  class Mapcap < ActiveRecord::Base
    include Carto::VisualizationsExportService2Importer
    include Carto::VisualizationsExportService2Exporter

    belongs_to :visualization, class_name: Carto::Visualization, foreign_key: 'visualization_id'

    before_save :generate_export_json, :generate_ids_json
    after_commit :invalidate_visualization_cache

    def regenerate_visualization
      regenerated_visualization = build_visualization_from_json_export(export_json)

      regenerated_visualization.user = visualization.user
      regenerated_visualization.map.user = visualization.user

      regenerated_visualization.id = ids_json[:id]
      regenerated_visualization.map.layers.each_with_index do |layer, index|
        ids_json_layers = ids_json[:layers]

        layer.id = ids_json_layers[index].keys.first
        layer.maps = [regenerated_visualization.map]

        layer.widgets.each_with_index do |widget, widget_index|
          layer_id = layer.id

          widget.id = ids_json_layers[layer_id.to_sym][widget_index]
          widget.layer_id = layer_id
        end
      end

      regenerated_visualization
    end

    def ids_json
      JSON.load(self[:ids_json]).with_indifferent_access
    end

    private

    def generate_export_json
      self.export_json = export_visualization_json_string(visualization_id, visualization.user)
    end

    def generate_ids_json
      self.ids_json = {
        id: visualization.id,
        map_id: visualization.map.id,
        layers: visualization.layers.map { |layer| { "#{layer.id}": layer.widgets.map(&:id) } }
      }.to_json
    end

    def invalidate_visualization_cache
      visualization.invalidate_cache
    end
  end
end
