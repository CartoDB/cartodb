module Carto
  class LayerFactory
    def self.build_default_base_layer(user)
      basemap = user.default_basemap.except('default')
      options = if basemap['className'] === 'googlemaps'
                  { kind: 'gmapsbase', options: basemap }
                else
                  { kind: 'tiled', options: basemap }
                end

      Carto::Layer.new(options)
    end

    def self.build_default_labels_layer(base_layer)
      base_layer_options = base_layer.options

      Carto::Layer.new(
        kind: 'tiled',
        options: base_layer_options.except('className', 'labels').merge(
          'type' => 'Tiled',
          'name' => "#{base_layer_options['name']} Labels"
        ).merge(base_layer_options['labels'])
      )
    end

    def self.build_data_layer(user_table)
      user = user_table.user
      geometry_type = user_table.geometry_type

      data_layer = Carto::Layer.new(Cartodb.get_config(:layer_opts, 'data').deep_dup)
      layer_options = data_layer.options
      layer_options['table_name'] = user_table.name
      layer_options['user_name'] = user.username
      layer_options['tile_style'] = tile_style(user, geometry_type)
      data_layer.infowindow ||= {}
      data_layer.infowindow['fields'] = []
      data_layer.tooltip ||= {}
      data_layer.tooltip['fields'] = []

      if user.builder_enabled?
        data_layer.options['style_properties'] = style_properties(geometry_type)
      end

      data_layer
    end

    # private

    def self.style_properties(geometry_type)
      {
        type: 'simple',
        properties: Carto::Form.new(geometry_type).to_hash
      }
    end
    private_class_method :style_properties

    def self.tile_style(user, geometry_type)
      user.builder_enabled? ? builder_tile_style(geometry_type) : legacy_tile_style(geometry_type)
    end
    private_class_method :tile_style

    def self.builder_tile_style(geometry_type)
      style_class = Carto::Styles::Style.style_for_geometry_type(geometry_type)

      style_class ? style_class.new.to_cartocss : legacy_tile_style(geometry_type)
    end
    private_class_method :builder_tile_style

    def self.legacy_tile_style(geometry_type)
      "#layer #{Cartodb.get_config(:layer_opts, 'default_tile_styles', geometry_type)}"
    end
    private_class_method :legacy_tile_style
  end
end
