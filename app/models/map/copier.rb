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

      def copy_data_layers(origin_map, destination_map)
        data_layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end

      private

      attr_reader :map

      def data_layer_copies_from(map)
        map.carto_and_torque_layers.map { |layer|
          layer.copy
        }
      end

      def layer_copies_from(map)
        map.layers.map { |layer|
          layer.copy
        }
      end

      def link(map, layer)
        layer.save
        layer.add_map(map)
        layer.save
      end
    end
  end
end
