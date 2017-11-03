module Carto
  class VisualizationFactory
    def self.create_canonical_visualization(user_table)
      kind = user_table.raster? ? Carto::Visualization::KIND_RASTER : Carto::Visualization::KIND_GEOM
      esv = user_table.external_source_visualization
      user = user_table.user

      # Map must be saved before layers, so register_table_dependencies is called after adding each layer
      # to the map. There are several reloads in this process, since the layers<->maps relation is not synchronized
      # with inverse_of (not supported in Rails, for has_many through relations).
      layers = build_canonical_layers(user_table)
      base_layers = layers.select(&:basemap?)

      visualization = Carto::Visualization.new(
        name: user_table.name,
        map: build_canonical_map(user, base_layers.first),
        type: Carto::Visualization::TYPE_CANONICAL,
        description: user_table.description,
        attributions: esv.try(:attributions),
        source: esv.try(:source),
        tags: user_table.tags && user_table.tags.split(','),
        privacy: user_table.visualization_privacy,
        user: user,
        kind: kind,
        overlays: Carto::OverlayFactory.build_default_overlays(user)
      )

      visualization.save!
      layers.each do |layer|
        layer.maps << visualization.map
        # This reload is needed for map.layers to contain the layers
        visualization.map.reload
        layer.save!
      end
      visualization
    end

    # private

    def self.build_canonical_map(user, base_layer)
      Carto::Map.new(
        user: user,
        provider: Carto::Map.provider_for_baselayer_kind(base_layer.kind)
      )
    end
    private_class_method :build_canonical_map

    def self.build_canonical_layers(user_table)
      user = user_table.user

      base_layer = Carto::LayerFactory.build_default_base_layer(user)
      data_layer = Carto::LayerFactory.build_data_layer(user_table)
      layers = [base_layer, data_layer]
      layers << Carto::LayerFactory.build_default_labels_layer(base_layer) if base_layer.supports_labels_layer?

      layers
    end
    private_class_method :build_canonical_layers
  end
end
