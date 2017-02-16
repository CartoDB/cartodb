module Carto
  module LayerFactory
    def build_default_base_layer(user)
      basemap = user.default_basemap
      options = if basemap['className'] === 'googlemaps'
                  { kind: 'gmapsbase', options: basemap }
                else
                  { kind: 'tiled', options: basemap.merge('urlTemplate' => basemap['url']) }
                end

      Carto::Layer.new(options)
    end

    def build_default_labels_layer(base_layer)
      base_layer_options = base_layer.options
      labels_layer_url = base_layer_options['labels']['url']

      Carto::Layer.new(
        kind: 'tiled',
        options: base_layer_options.except('name', 'className', 'labels').merge(
          'urlTemplate' => labels_layer_url,
          'url' => labels_layer_url,
          'type' => 'Tiled',
          'name' => "#{base_layer_options['name']} Labels"
        )
      )
    end

    def build_data_layer(user_table)
      user = user_table.user
      geometry_type = user_table.geometry_type

      data_layer = Carto::Layer.new(Cartodb.config[:layer_opts]['data'])
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

    private

    def style_properties(geometry_type)
      {
        type: 'simple',
        properties: Carto::Form.new(geometry_type).to_hash
      }
    end

    def tile_style(user, geometry_type)
      user.builder_enabled? ? builder_tile_style(geometry_type) : legacy_tile_style(geometry_type)
    end

    def builder_tile_style(geometry_type)
      style_class = Carto::Styles::Style.style_for_geometry_type(geometry_type)

      style_class ? style_class.new.to_cartocss : legacy_tile_style(geometry_type)
    end

    def legacy_tile_style(geometry_type)
      "#layer #{Cartodb.config[:layer_opts]['default_tile_styles'][geometry_type]}"
    end
  end
end
