require_dependency 'carto/uuidhelper'

module Carto
  module VisualizationFactory
    include Carto::LayerFactory
    include Carto::OverlayFactory
    include Carto::UUIDHelper

    def build_canonical_visualization(user_table)
      kind = user_table.service.is_raster? ? Carto::Visualization::KIND_RASTER : Carto::Visualization::KIND_GEOM
      esv = user_table.external_source_visualization
      user = user_table.user

      visualization = Carto::Visualization.new(
        name: user_table.name,
        map: build_canonical_map(user_table),
        type: Carto::Visualization::TYPE_CANONICAL,
        description: user_table.description,
        attributions: esv.try(:attributions),
        source: esv.try(:source),
        tags: tags && tags.split(','),
        privacy: user_table.visualization_privacy,
        user: user,
        kind: kind,
        overlays: build_default_overlays(user)
      )

      # This should be done with a DB default
      visualization.id = random_uuid

      visualization
    end

    private

    def build_canonical_map(user_table)
      user = user_table.user

      base_layer = build_default_base_layer(user)
      data_layer = build_data_layer(user_table)
      layers = [base_layer, data_layer]
      layers << build_default_labels_layer(base_layer) if base_layer.supports_labels_layer?

      options = Carto::Map::DEFAULT_OPTIONS.merge(
        user: user,
        provider: Carto::Map.provider_for_baselayer_kind(base_layer.kind),
        layers: layers
      )

      Carto::Map.new(options)

      # TODO: Calculate bound
    end
  end
end
