require_relative '../../app/services/carto/visualizations_export_service_2'

module Carto
  module MapcappedVisualizationUpdater
    include VisualizationsExportService2Exporter

    # Takes a block |visualization, persisted| in which you should do the modifications
    # Only call .save (or equivalent) if persisted is true or this will fail. Return the result of saving
    def update_visualization_and_mapcap(visualization)
      # Update the persisted visualization
      return false unless yield visualization, true

      # Update the mapcap (if it exists)
      if visualization.mapcapped?
        mapcap = visualization.latest_mapcap
        regenerated_viz = mapcap.regenerate_visualization

        yield regenerated_viz, false

        mapcap.export_json = export_in_memory_visualization(regenerated_viz, regenerated_viz.user)
        return false unless mapcap.save
      end

      true
    end

    private

    # Reimplementation of VisualizationExportService2.export_visualization_json_hash
    # that works with in-memory visualizations
    def export_in_memory_visualization(visualization, user)
      {
        version: CURRENT_VERSION,
        visualization: export(visualization, user, with_mapcaps: false)
      }
    end
  end
end
