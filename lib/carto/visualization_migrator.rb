module Carto
  module VisualizationMigrator
    def migrate_visualization_to_v3(vis)
      raise "#{vis.id} is not v3" unless vis.version == 3
      # Non-private visualizations need to have a Mapcap to be "published" in the Builder (available at the embed)

      layer_selector_migration(vis)
      google_basemap_migration(vis)
      analysis_migration(vis)
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

    def google_basemap_migration(vis)
      # Editor gmaps were saved with base_type attribute in options, but, in builder, baseType is expected
      vis = Carto::Visualization.find(vis.id) unless vis.class.name == 'Carto::Visualization'
      vis.layers.select { |l| l.gmapsbase? && l.options.has_key?(:base_type) }.each do |l|
        l.options[:baseType] = l.options.delete(:base_type)
        l.save!
      end
    end

    def analysis_migration(vis)
      vis.add_source_analyses
      vis.reload
    end
  end
end
