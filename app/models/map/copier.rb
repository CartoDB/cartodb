# encoding: utf-8
require_relative '../map'

module CartoDB
  module Map
    class Copier
      def copy(map)
        new_map = new_map_from(map).save
        copy_layers(map, new_map)

        new_map
      end #copy

      def new_map_from(map)
        @new_map ||= ::Map.new(map.to_hash.select { |k, v| k != :id })
      end #new_map

      def copy_layers(origin_map, destination_map)
        layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end #copy_layers

      def copy_base_layer(origin_map, destination_map)
        origin_map.user_layers.map do |layer| 
          link(destination_map, layer.copy)
        end
      end #copy_base_layer

      def copy_data_layers(origin_map, destination_map)
        data_layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end #copy_data_layers

      private

      attr_reader :map

      def data_layer_copies_from(map)
        map.carto_and_torque_layers.map { |layer| layer.copy }
      end #data_layer_copies_from

      def layer_copies_from(map)
        map.layers.map { |layer| layer.copy }
      end #new_layers

      def link(map, layer)
        layer.save
        layer.add_map(map)
        layer.save
      end #link
    end # Copier
  end # Map
end # CartoDB

