# encoding: utf-8

module CartoDB
  module Map
    class Copier
      def copy(map, layers=true)
        new_map = new_map_from(map).save
        if layers
          copy_layers(map, new_map)
        end

        new_map
      end

      def new_map_from(map)
        @new_map ||= ::Map.new(map.to_hash.select { |k, v| k != :id })
        # Explicit association assignment to make user itself available, beyond its id, for validations
        if map.user
          @new_map.user ||= map.user
        end
        @new_map
      end

      def copy_layers(origin_map, destination_map)
        layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end

      def copy_base_layer(origin_map, destination_map)
        origin_map.user_layers.map do |layer|
          link(destination_map, layer.copy)
        end
      end

      def copy_data_layers(origin_map, destination_map, user)
        data_layer_copies_from(origin_map, user).map do |layer|
          link(destination_map, layer)
        end
      end

      private

      attr_reader :map

      def data_layer_copies_from(map, user)
        map.carto_and_torque_layers.map do |layer|
          new_layer = layer.copy
          new_layer.qualify_for_organization(map.user.username) if user.id != map.user.id

          user.force_builder? ? reset_layer_styles(layer, new_layer) : new_layer
        end
      end

      def layer_copies_from(map)
        map.layers.map(&:copy)
      end

      def link(map, layer)
        layer.save
        layer.add_map(map)
        layer.save
      end

      def reset_layer_styles(old_layer, new_layer)
        user_table = old_layer.user_tables.first
        return new_layer unless user_table

        geometry_type = user_table.service.geometry_types.first
        return new_layer unless geometry_type

        tile_style = ModelFactories::LayerFactory.builder_tile_style(geometry_type)
        new_layer.options['tile_style'] = tile_style

        style_properties = ModelFactories::LayerFactory.style_properties(geometry_type)
        new_layer.options['style_properties'] = style_properties

        new_layer
      end
    end
  end
end
