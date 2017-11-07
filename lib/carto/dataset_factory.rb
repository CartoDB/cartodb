# encoding: utf-8

module Carto
  # This class is in lib/carto because there's no 'Dataset' model in CARTO. The
  # idea here is to provide an abstract interface that allows the programmer to
  # take distance with the underlying 'table type visualization' and focus on
  # the product concept of 'Dataset'. This should NOT be an entry point to
  # solving problems with the visualization model. There is no such thing as a
  # 'Dataset' outside of the product scope, which may very well disappear or
  # change in the future
  class DatasetFactory
    def initialize(user:, metadata:, kind:, geometry_type:)
      @user = user
      @metadata = metadata
      @kind = kind
      @geometry_type = geometry_type
    end

    def dataset_visualization
      provider = Carto::Map.provider_for_baselayer_kind(layers.first.kind)
      map = Carto::Map.new(user: @user, provider: provider)

      dataset_visualization = Carto::Visualization.new(
        type: 'table',
        user: @user,
        map: map,
        name: name,
        description: description,
        attributions: attributions,
        source: source,
        privacy: privacy,
        tags: tags,
        kind: @kind,
        overlays: Carto::OverlayFactory.build_default_overlays(@user)
      )

      dataset_visualization.map.layers = layers

      dataset_visualization
    end

    private

    def info
      @info ||= @metadata[:info]
    end

    def name
      @name ||= (info && info[:name])
    end

    def description
      @description ||= (info && info[:description])
    end

    def attributions
      @attributions ||= (info && info[:attributions])
    end

    def source
      @source ||= (info && info[:source])
    end

    def classification
      info && info[:classification]
    end

    def tags
      classification && classification[:tags]
    end

    def publishing
      @publishing ||= @metadata[:publishing]
    end

    def privacy
      @privacy ||= publishing && publishing[:privacy]
    end

    def layers
      return @layers if @layers

      base_layer = Carto::LayerFactory.build_default_base_layer(@user)
      data_layer = Carto::LayerFactory.build_data_layer(@user, name, @geometry_type)
      layers = [base_layer, data_layer]

      if base_layer.supports_labels_layer?
        layers << Carto::LayerFactory.build_default_labels_layer(base_layer)
      end

      @layers = layers
    end
  end
end
