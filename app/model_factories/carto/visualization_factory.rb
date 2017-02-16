module Carto
  class VisualizationFactory
    def self.build_canonical_visualization(user_table)
      kind = user_table.raster? ? Carto::Visualization::KIND_RASTER : Carto::Visualization::KIND_GEOM
      esv = user_table.external_source_visualization
      user = user_table.user

      Carto::Visualization.new(
        name: user_table.name,
        map: build_canonical_map(user_table),
        type: Carto::Visualization::TYPE_CANONICAL,
        description: user_table.description,
        attributions: esv.try(:attributions),
        source: esv.try(:source),
        tags: user_table.tags && user_table.tags.split(','),
        privacy: user_table.visualization_privacy,
        user: user,
        kind: kind,
        overlays: Carto::OverlayFactory.build_default_overlays(user),
        permission: Carto::Permission.new(owner: user, owner_username: user.username)
      )
    end

    # private

    def self.build_canonical_map(user_table)
      user = user_table.user

      base_layer = Carto::LayerFactory.build_default_base_layer(user)
      data_layer = Carto::LayerFactory.build_data_layer(user_table)
      layers = [base_layer, data_layer]
      layers << Carto::LayerFactory.build_default_labels_layer(base_layer) if base_layer.supports_labels_layer?

      options = Carto::Map::DEFAULT_OPTIONS.merge(
        user: user,
        provider: Carto::Map.provider_for_baselayer_kind(base_layer.kind),
        layers: layers
      )

      Carto::Map.new(options)
    end
    private_class_method :build_canonical_map
  end
end
