module Carto
  module VisualizationFactory
    def build_canonical_visualization(user_table)
      kind = user_table.service.is_raster? ? Carto::Visualization::KIND_RASTER : Carto::Visualization::KIND_GEOM
      esv = user_table.external_source_visualization

      visualization = Carto::Visualization.new(
        name: user_table.name,
        map: build_canonical_map(user_table),
        type: Carto::Visualization::TYPE_CANONICAL,
        description: user_table.description,
        attributions: esv.try(:attributions),
        source: esv.try(:source),
        tags: tags && tags.split(','),
        privacy: user_table.visualization_privacy,
        user: user_table.user,
        kind: kind
      )

      # Overlays!
    end

    private

    def build_canonical_map

    end

  end
end
