# encoding: utf-8

module CartoDB
  module Map
    class Copier
      def copy(map, layers=true, create_as_children=false)
        new_map = new_map_from(map).save
        if layers
          copy_layers(map, new_map, create_as_children)
        end

        new_map
      end

      def new_map_from(map)
        @new_map ||= ::Map.new(map.to_hash.select { |k, v| k != :id })
      end

      def copy_layers(origin_map, destination_map, create_as_children=false)
        layer_copies_from(origin_map, create_as_children).map do |layer|
          link(destination_map, layer)
        end
      end

      def copy_base_layer(origin_map, destination_map, create_as_children=false)
        origin_map.user_layers.map do |layer|
          if create_as_children
            link(destination_map, layer.copy({'parent_id' => layer.id}))
          else
            link(destination_map, layer.copy)
          end
        end
      end

      def copy_data_layers(origin_map, destination_map, create_as_children=false)
        data_layer_copies_from(origin_map, create_as_children).map do |layer|
          link(destination_map, layer)
        end
      end

      private

      attr_reader :map

      def data_layer_copies_from(map, create_as_children=false)
        map.carto_and_torque_layers.map { |layer|
          if create_as_children
            layer.copy({'parent_id' => layer.id})
          else
            layer.copy
          end
        }
      end

      def layer_copies_from(map, create_as_children=false)
        map.layers.map { |layer|
          if create_as_children
            layer.copy({'parent_id' => layer.id})
          else
            layer.copy
          end
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

