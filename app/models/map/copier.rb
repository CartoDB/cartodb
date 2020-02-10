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
        @new_map ||= map.dup
        # Explicit association assignment to make user itself available, beyond its id, for validations
        if map.user
          @new_map.user ||= map.user
        end

        # Default is to copy all attributes from the canonical map. This overrides it
        @new_map.scrollwheel = true
        @new_map.options[:scrollwheel] = true if @new_map.options

        @new_map
      end

      def copy_layers(origin_map, destination_map)
        layer_copies_from(origin_map).map do |layer|
          link(destination_map, layer)
        end
      end

      def copy_base_layer(origin_map, destination_map)
        origin_map.user_layers.map do |layer|
          link(destination_map, layer.dup)
        end
      end

      # TL;DR: adds data layers between existing base layers.
      #
      # Stacks data layer on top of the last data layer and/or
      # the first base layer found, and keeps any existing "top"
      # base layers on top.
      def copy_data_layers(origin_map, destination_map, user)
        last_data = destination_map.layers.reverse.find(&:data_layer?)
        order = if last_data
                  last_data.order + 1
                else
                  first_base = destination_map.layers.find(&:base_layer?)
                  first_base ? (first_base.order + 1) : 0
                end

        modified_layers = []

        data_layer_copies_from(origin_map, user).map do |layer|
          # Push layers on top if needed
          if(destination_map.layers.map(&:order).include?(order))
            destination_map.layers.select { |l| l.order >= order }.each do |layer|
              layer.order += 1
              # layer must be saved later
              modified_layers << layer
            end
          end

          layer.order = order
          link(destination_map, layer)
          # link saves
          modified_layers -= [layer]
          order += 1
        end

        # this avoid extra saving (including validation) overhead
        modified_layers.uniq.map(&:save)
      end

      private

      attr_reader :map

      def data_layer_copies_from(map, user)
        map.data_layers.map do |layer|
          new_layer = layer.dup
          new_layer.qualify_for_organization(map.user.username) if user.id != map.user.id

          user.builder_enabled? ? reset_layer_styles(layer, new_layer) : new_layer
        end
      end

      def layer_copies_from(map)
        map.layers.map(&:dup)
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
