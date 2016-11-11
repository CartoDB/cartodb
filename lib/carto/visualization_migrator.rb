module Carto
  module VisualizationMigrator
    # Runs all needed actions for visualizations that have just changed to v3.
    # Must be compatible with all visualization models.
    def migrate_visualization_to_v3(vis)
      raise "#{vis.id} is not v3" unless vis.version == 3
      # Non-private visualizations need to have a Mapcap to be "published" in the Builder (available at the embed)

      layer_selector_migration(vis)
      mapcap_creation(vis)
    end

    def version_needs_migration?(version, new_version)
      (version.nil? || version < 3) && new_version == 3
    end

    private

    def mapcap_creation(vis)
      if !vis.is_privacy_private? && !vis.mapcapped?
        Carto::Mapcap.create!(visualization_id: vis.id)
      end
    end

    def layer_selector_migration(vis)
      if vis.overlays.any? { |o| o.type == 'layer_selector' }
        map = vis.map
        options = (map.options || {}).merge(layer_selector: true)
        map.options = options
        map.save
      end

      vis.overlays.select { |o| o.type == 'layer_selector' }.each(&:destroy)
    end
  end
end
