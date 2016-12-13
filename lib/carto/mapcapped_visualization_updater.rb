module Carto
  module MapcappedVisualizationUpdater
    # Takes a block |visualization, persisted| in which you should do the modifications
    # Only call .save (or equivalent) if persisted is true or this will fail. Return the result of saving
    def self.update_visualization(visualization)
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

    # Reimplementation of VisualizationExportService2.export_visualization_json_hash
    # that works with in-memory visualizations
    def self.export_in_memory_visualization(visualization, user)
      {
        version: Carto::VisualizationsExportService2::CURRENT_VERSION,
        visualization: Carto::VisualizationsExportService2.new.send(:export, visualization, user)
      }
    end
    private_class_method :export_in_memory_visualization
  end
end
