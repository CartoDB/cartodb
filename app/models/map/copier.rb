# encoding: utf-8
require_relative '../map'

module CartoDB
  module Map
    class Copier
      def initialize(map)
        @map  = map
      end #initialize

      def copy
        attributes  = map.to_hash.select { |k, v| k != :id }
        new_map     = ::Map.new(attributes).save
        copy_layers(map, new_map)

        new_map
      end #copy

      def copy_layers(origin_map, destination_map)
        layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end #copy_layers

      def copy_data_layers(origin_map, destination_map)
        data_layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end #copy_data_layers

      private

      attr_reader :map

      def data_layer_copies_from(map)
        map.data_layers.map { |layer| layer.copy }
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

