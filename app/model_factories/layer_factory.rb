# encoding: utf-8

require_relative '../../lib/carto/styles/style'
require_relative '../../lib/carto/styles/point'
require_relative '../../lib/carto/styles/line'
require_relative '../../lib/carto/styles/polygon'
require_relative '../../lib/carto/styles/geometry'
require_relative '../../lib/carto/form'

module ModelFactories
  class LayerFactory
    def self.get_new(options)
      ::Layer.new(options)
    end

    def self.get_default_base_layer(user)
      basemap = user.default_basemap.except('default')
      options = if basemap['className'] === 'googlemaps'
                  { kind: 'gmapsbase', options: basemap }
                else
                  { kind: 'tiled', options: basemap }
                end

      ::Layer.new(options)
    end

    def self.get_default_data_layer(table_name, user, geometry_type)
      data_layer = ::Layer.new(Cartodb.config[:layer_opts]['data'].deep_dup)
      data_layer.options['table_name'] = table_name
      data_layer.options['user_name'] = user.username
      data_layer.options['tile_style'] = tile_style(user, geometry_type)
      data_layer.infowindow ||= {}
      data_layer.infowindow['fields'] = []
      data_layer.tooltip ||= {}
      data_layer.tooltip['fields'] = []

      if user.builder_enabled?
        data_layer.options['style_properties'] = style_properties(geometry_type)
      end

      data_layer
    end

    # Info: does not perform validity checks
    def self.get_default_labels_layer(base_layer)
      ::Layer.new(
        kind: 'tiled',
        options: base_layer.options.except('className', 'labels').merge(
          'type' => 'Tiled',
          'name' => "#{base_layer.options['name']} Labels"
        ).merge(base_layer.options['labels'])
      )
    end

    def self.style_properties(geometry_type)
      {
        type: 'simple',
        properties: Carto::Form.new(geometry_type).to_hash
      }
    end

    def self.tile_style(user, geometry_type)
      user.builder_enabled? ? builder_tile_style(geometry_type) : legacy_tile_style(geometry_type)
    end

    def self.builder_tile_style(geometry_type)
      style_class = Carto::Styles::Style.style_for_geometry_type(geometry_type)

      style_class ? style_class.new.to_cartocss : legacy_tile_style(geometry_type)
    end

    def self.legacy_tile_style(geometry_type)
      "#layer #{Cartodb.config[:layer_opts]['default_tile_styles'][geometry_type]}"
    end
  end
end
