# encoding: utf-8

require_dependency 'map/copier'

module CartoDB
  module Visualization
    class TableBlender
      def initialize(user, tables=[])
        @user   = user
        @tables = tables
      end

      def blend
        raise "Viewer users can't blend tables" if user.viewer

        maps            = tables.map(&:map)
        copier          = CartoDB::Map::Copier.new
        destination_map = copier.new_map_from(maps.first)
        destination_map.save

        if @user.builder_enabled?
          base_layer = Carto::LayerFactory.build_default_base_layer(@user)
          destination_map.layers << base_layer
          if base_layer.supports_labels_layer?
            destination_map.layers << Carto::LayerFactory.build_default_labels_layer(base_layer)
          end
        else
          copier.copy_base_layer(maps.first, destination_map)
        end

        maps.each { |map| copier.copy_data_layers(map, destination_map, user) }

        destination_map.user_id = user.id
        destination_map.save
        destination_map
      end

      def blended_privacy
        return Carto::Visualization::PRIVACY_PRIVATE if tables.any?(&:private?)
        return Carto::Visualization::PRIVACY_LINK if tables.any?(&:public_with_link_only?)
        Carto::Visualization::PRIVACY_PUBLIC
      end

      private

      attr_reader :tables, :user
    end
  end
end
