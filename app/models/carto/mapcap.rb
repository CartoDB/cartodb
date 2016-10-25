# encoding: utf-8

require_dependency 'carto/visualizations_export_service_2'
require_relative './carto_json_serializer'
require_dependency 'carto/named_maps/api'

module Carto
  class Mapcap < ActiveRecord::Base
    include Carto::VisualizationsExportService2Importer
    include Carto::VisualizationsExportService2Exporter

    belongs_to :visualization, class_name: Carto::Visualization, foreign_key: 'visualization_id'

    serialize :ids_json, ::Carto::CartoJsonSerializer
    serialize :export_json, ::Carto::CartoJsonSerializer

    after_save :notify_map_change, :update_named_map
    after_destroy :notify_map_change

    before_validation :lazy_export_json, :lazy_ids_json

    validates :ids_json, carto_json_symbolizer: true
    validates :export_json, carto_json_symbolizer: true

    validate :under_max_mapcaps_per_visualziation

    def regenerate_visualization
      regenerated_visualization = build_visualization_from_hash_export(lazy_export_json)

      regenerated_visualization.user = regenerated_visualization.map.user = visualization.user
      regenerated_visualization.permission = visualization.permission

      regenerated_visualization.populate_ids(lazy_ids_json)

      regenerated_visualization
    end

    def self.latest_for_visualization(visualization_id)
      where(visualization_id: visualization_id).order('created_at DESC')
    end

    private

    def lazy_export_json
      self.export_json ||= export_visualization_json_hash(visualization_id, visualization.user)
    end

    def lazy_ids_json
      self.ids_json ||= visualization.ids_json
    end

    def notify_map_change
      visualization.map.force_notify_map_change
    end

    def update_named_map
      Carto::NamedMaps::Api.new(regenerate_visualization).update
    end

    MAX_MAPCAPS_PER_VISUALIZATION = 1

    def under_max_mapcaps_per_visualziation
      other_mapcaps = visualization.mapcaps.select { |mapcap| mapcap.id != id }

      unless other_mapcaps.count < MAX_MAPCAPS_PER_VISUALIZATION
        other_mapcaps.last.destroy
      end
    end
  end
end
