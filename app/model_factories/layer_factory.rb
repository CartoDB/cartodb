# encoding: utf-8

require_relative '../../lib/carto/cartocss/styles/style'
require_relative '../../lib/carto/cartocss/styles/point'
require_relative '../../lib/carto/cartocss/styles/line'
require_relative '../../lib/carto/cartocss/styles/polygon'

module ModelFactories
  class LayerFactory
    def self.get_new(options)
      ::Layer.new(options)
    end

    def self.get_default_base_layer(user)
      basemap = user.default_basemap
      options = if basemap['className'] === 'googlemaps'
                  { kind: 'gmapsbase', options: basemap }
                else
                  { kind: 'tiled', options: basemap.merge('urlTemplate' => basemap['url']) }
                end

      ::Layer.new(options)
    end

    def self.get_default_data_layer(table_name, user, the_geom_column_type = 'geometry')
      data_layer = ::Layer.new(Cartodb.config[:layer_opts]['data'])
      data_layer.options['table_name'] = table_name
      data_layer.options['user_name'] = user.username
      data_layer.options['tile_style'] = tile_style(user, the_geom_column_type)
      if user.builder_enabled?
        data_layer.options['style_properties'] = style_properties(user, the_geom_column_type)
      end
      data_layer.infowindow ||= {}
      data_layer.infowindow['fields'] = []
      data_layer.tooltip ||= {}
      data_layer.tooltip['fields'] = []
      data_layer
    end

    # Info: does not perform validity checks
    def self.get_default_labels_layer(base_layer)
      labels_layer_url = base_layer.options['labels']['url']

      ::Layer.new(
        kind: 'tiled',
        options: base_layer.options.except('name', 'className', 'labels').merge(
          'urlTemplate' => labels_layer_url,
          'url' => labels_layer_url,
          'type' => 'Tiled',
          'name' => "#{base_layer.options['name']} Labels"
        )
      )
    end

    def self.style_properties(user, geometry_type)
      {
        "type" => 'simple',
        "properties" => {

        }
      }
    end

    def self.tile_style(user, geometry_type)
      style_class = Carto::CartoCSS::Styles::Style.style_for_geometry_type(geometry_type)

      if user.builder_enabled? && style_class
        style_class.new.to_cartocss
      else
        "#layer #{Cartodb.config[:layer_opts]['default_tile_styles'][geometry_type]}"
      end
    end
  end
end
