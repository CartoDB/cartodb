# encoding: utf-8

require_dependency 'carto/api/vizjson3_presenter'

module Carto
  module NamedMaps
    class Template
      NAMED_MAPS_VERSION = '0.0.1'.freeze
      CARTOCSS_VERSION = '2.0.1'.freeze
      NAME_PREFIX = 'tpl_'.freeze
      AUTH_TYPE_OPEN = 'open'.freeze
      AUTH_TYPE_SIGNED = 'token'.freeze
      EMPTY_CSS = '#dummy{}'.freeze
      NAMED_MAP_LAYERS = ['tiled', 'background', 'gmapsbase', 'wms', 'carto'].freeze

      TILER_WIDGET_TYPES = {
        'category': 'aggregation',
        'formula': 'formula',
        'histogram': 'histogram',
        'list': 'list',
        'time-series': 'histogram'
      }.freeze

      def initialize(visualization)
        raise 'Carto::NamedMaps::Template needs a Carto::Visualization' unless visualization.is_a?(Carto::Visualization)

        @visualization = visualization
        @vizjson = Carto::Api::VizJSON3Presenter.new(visualization).to_named_map_vizjson
      end

      def generate_template
        stats_aggregator.timing('named-map.template-data') do
          {
            name: name,
            auth: auth,
            version: NAMED_MAPS_VERSION,
            layergroup: {
              layers: layers,
              stat_tag: @visualization.id,
              dataviews: dataviews,
              analyses: analyses
            },
            view: view
          }
        end
      end

      private

      def layers
        layers = []
        map = @visualization.map

        map.named_maps_layers.map(&:basemap?).each do |layer|
          type, options = type_and_options_for_basemap_layers(layer)

          layers.push(type: type, options: options)
        end

        map.named_maps_layers.map(&:data_layer?).each_with_index do |layer, index|
          type, options = type_and_options_for_cartodb_layers(layer, index)

          layers.push(type: type, options: options)
        end

        layers
      end

      def type_and_options_for_cartodb_layers(layer, index)
        layer_options = layer.options

        options = {
          cartocss: layer_options.fetch('tile_style').strip.empty? ? EMPTY_CSS : layer_options.fetch('tile_style'),
          cartocss_version: '2.0.1',
          interactivity: layer_options[:interactivity]
        }

        layer_options_source = layer_options[:source]
        if layer_options_source
          options[:source] = { id: layer_options_source }
        else
          options[:sql] =
            "SELECT * FROM (#{layer_options[:query]}) AS wrapped_query WHERE <%= layer#{index} %>=1"
        end

        layer_infowindow = layer.infowindow
        if layer_infowindow && layer_infowindow.fetch('fields') && !layer_infowindow.fetch('fields').empty?
          options[:attributes] = {
            id:       'cartodb_id',
            columns:  layer_infowindow['fields'].map { |field| field.fetch('name') }
          }
        end

        ['cartodb', options]
      end

      def type_and_options_for_basemap_layers(layer)
        layer_options = layer.options

        if layer_options['type'] == 'Plain'
          type = 'plain'

          layer_options = if layer_options['image'].empty?
                            { color: layer_options['color'] }
                          else
                            { imageUrl: layer_options['image'] }
                          end
        else
          type = 'http'

          layer_options = if layer_options['urlTemplate'] && !layer_options['urlTemplate'].empty?
                            options = {
                              urlTemplate: layer_options['urlTemplate']
                            }

                            if layer_options.include?('subdomains')
                              options[:subdomains] = layer_options['subdomains']
                            end

                            options
                          end
        end

        [type, layer_options]
      end

      def options(layer)
        layer_options = layer.options
        {
          source: {
            id: layer_options[:source]
          },
          cartocss: layer_options.fetch('tile_style').strip.empty? ? EMPTY_CSS : layer_options.fetch('tile_style'),
          cartocss_version: CARTOCSS_VERSION
        }
      end

      def dataviews
        dataviews = []

        @visualization.widgets.each do |widget|
          dataviews << {
            "#{widget.id}": dataview_data(widget)
          }
        end

        dataviews
      end

      def analyses
        @visualization.analyses.map(&:analysis_definition)
      end

      def stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      def dataview_data(widget)
        options = widget.options
        options[:aggregationColumn] = options[:aggregation_column]
        options.delete(:aggregation_column)

        dataview_data = {
          type: TILER_WIDGET_TYPES[widget.type],
          options: options
        }

        dataview_data[:source] = { id: widget.source_id } if widget.source_id.present?

        dataview_data
      end

      def name
        (NAME_PREFIX + @visualization.id).gsub(/[^a-zA-Z0-9\-\_.]/, '').tr('-', '_')
      end

      def auth
        method, valid_tokens = if @visualization.password_protected?
                                 [AUTH_TYPE_SIGNED, @visualization.get_auth_tokens]
                               elsif @visualization.organization?
                                 auth_tokens = @visualization.all_users_with_read_permission
                                                             .map(&:get_auth_tokens)
                                                             .flatten
                                                             .uniq

                                 [AUTH_TYPE_SIGNED, auth_tokens]
                               else
                                 [AUTH_TYPE_OPEN, nil]
                               end

        auth = { method: method }
        auth[:valid_tokens] = valid_tokens if valid_tokens

        auth
      end

      def view
        map = @visualization.map
        center_data = map.center_data

        data = {
          zoom: map.zoom,
          center: {
            lng: center_data[1].to_f,
            lat: center_data[0].to_f
          }
        }

        bounds_data = map.view_bounds_data

        # INFO: Don't return 'bounds' if all points are 0 to avoid static map trying to go too small zoom level
        if bounds_data[:west] != 0 || bounds_data[:south] != 0 || bounds_data[:east] != 0 || bounds_data[:north] != 0
          data[:bounds] = bounds_data
        end

        data
      end

      # def placeholders
      #   placeholders = {}

      #   @vizjson[:layers].select { |layer| layer[:kind] == 'namedmap' }.each_with_index do |layer, index|
      #     if layer[:type].casecmp('cartodb') == 0
      #       placeholders["layer#{index}".to_sym] = {
      #         type:     'number',
      #         default:  layer[:visible] ? 1 : 0
      #       }
      #     end
      #   end

      #   placeholders
      # end

      # def layergroup
      #   layers_data = []

      #   vizjson_layergroup = @vizjson[:layers].select { |layer| layer[:type] == 'layergroup' }[0]
      #   if vizjson_layergroup
      #     vizjson_layergroup_layers = vizjson_layergroup[:options][:layer_definition][:layers]

      #     vizjson_layergroup_layers.each_with_index do |layer, index|
      #       options = options_for_layer(layer, index)

      #       layers_data.push(type: options[:layer_name], options: options[:layer_options]) if options
      #     end
      #   end

      #   vizjson_layers = @vizjson[:layers]
      #   vizjson_layers.reject { |layer| NON_OTHER_LAYER_KINDS.include?(layer[:kind]) }.each_with_index do |layer|
      #     layer_options = layer[:options]

      #     layer_data = {
      #       type: layer[:type].downcase,
      #       options: {
      #         cartocss_version: CARTOCSS_VERSION,
      #         cartocss: css_from(layer_options)
      #       }
      #     }

      #     source = layer_options['source']
      #     layer_data_options = layer_data[:options]
      #     if source
      #       layer_options.delete('query')
      #       layer_data_options[:source] = { id: layer_options.fetch('source') }
      #     else
      #       layer_data_options[:sql] = layer_options.fetch('query')
      #     end

      #     widgets_data = widgets_data_for_layer(layer)
      #     layer_data[:options][:widgets] = widgets_data if widgets_data

      #     layers_data.push(layer_data)
      #   end

      #   visualization_id = @visualization.id
      #   layergroup = {}

      #   layergroup[:layers] = layers_data.compact.flatten
      #   layergroup[:stat_tag] = visualization_id

      #   widgets = Carto::Widget.visualization_analysis_widgets(visualization_id)
      #   if widgets.present?
      #     widget_names_and_options = widgets.map { |widget| [widget.id, dataview_data(widget)] }
      #     layergroup[:dataviews] = widget_names_and_options.to_h
      #   end

      #   analyses = Carto::Analysis.where(visualization_id: visualization_id)
      #   if analyses.present?
      #     layergroup[:analyses] = analyses.map(&:analysis_definition_for_api)
      #   end

      #   layergroup
      # end

      # def widgets_data_for_layer(layer)
      #   layer_widgets = Carto::Widget.layer_widgets(layer[:id])
      #   if layer_widgets.empty?
      #     nil
      #   else
      #     widget_names_and_options = layer_widgets.map { |w| [w.id, dataview_data(w)] }
      #     Hash[*widget_names_and_options.flatten]
      #   end
      # end

      # def options_for_layer(layer, layer_num)
      #   options = if layer[:type].casecmp('cartodb') == 0
      #               options_for_cartodb_layer(layer, layer_num)
      #             else
      #               options_for_basemap_layer(layer, layer_num)
      #             end

      #   widgets_data = widgets_data_for_layer(layer)
      #   options[:layer_options][:widgets] = widgets_data if widgets_data

      #   options
      # end

      # def css_from(options)
      #   options.fetch('tile_style').strip.empty? ? EMPTY_CSS : options.fetch('tile_style')
      # end

      # def options_for_cartodb_layer(layer, layer_num)
      #   layer_options = layer[:options].except [:sql, :interactivity]

      #   layer_placeholder = "layer#{layer_num}"

      #   unless layer_options[:source]
      #     layer_options[:sql] =
      #       "SELECT * FROM (#{layer[:options][:sql]}) AS wrapped_query WHERE <%= #{layer_placeholder} %>=1"
      #   end

      #   if layer[:infowindow] && layer[:infowindow][:fields] && !layer[:infowindow][:fields].empty?
      #     layer_options[:interactivity] = layer[:options][:interactivity]
      #     layer_options[:attributes] = {
      #       id:       'cartodb_id',
      #       columns:  layer[:infowindow]['fields'].map { |field| field.fetch('name') }
      #     }
      #   end

      #   layer_options = {
      #     layer_name: 'cartodb',
      #     layer_options: layer_options
      #   }

      #   layer_options
      # end

      # def options_for_basemap_layer(layer, layer_num)
      #   if layer[:options]['type'] == 'Plain'
      #     if layer[:options]['image'].length > 0
      #       background_image_basemap_layer(layer, layer_num, template_data)
      #     else
      #       plain_color_basemap_layer(layer, layer_num, template_data)
      #     end
      #   else
      #     valid_http_basemap_layer?(layer) ? http_basemap_layer(layer, layer_num, template_data) : nil
      #   end
      # end

      # def valid_http_basemap_layer?(layer)
      #   layer[:options]['urlTemplate'] && layer[:options]['urlTemplate'].length > 0
      # end

      # def http_basemap_layer(layer, layer_num, template_data)
      #   layer_options = {
      #     urlTemplate: layer[:options]['urlTemplate']
      #   }
      #   if layer[:options].include?('subdomains')
      #     layer_options[:subdomains] = layer[:options]['subdomains']
      #   end

      #   {
      #     layer_name: 'http',
      #     layer_options: layer_options,
      #     # Basemap layers don't increment layer index/number
      #     layer_num: layer_num,
      #     template_data: template_data
      #   }
      # end

      # def background_image_basemap_layer(layer, layer_num, template_data)
      #   layer_options = {
      #     imageUrl: layer[:options]['image']
      #   }
      #   plain_layer(layer_options, layer_num, template_data)
      # end

      # def plain_color_basemap_layer(layer, layer_num, template_data)
      #   layer_options = {
      #     color: layer[:options]['color']
      #   }
      #   plain_layer(layer_options, layer_num, template_data)
      # end

      # def plain_layer(layer_options, layer_num, template_data)
      #   {
      #     layer_name: 'plain',
      #     layer_options: layer_options,
      #     # Basemap layers don't increment layer index/number
      #     layer_num: layer_num,
      #     template_data: template_data
      #   }
      # end
    end
  end
end
