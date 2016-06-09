# encoding: utf-8

module Carto
  module NamedMaps
    class Template
      NAMED_MAPS_VERSION = '0.0.1'.freeze
      NAME_PREFIX = 'tpl_'.freeze
      AUTH_TYPE_OPEN = 'open'.freeze
      AUTH_TYPE_SIGNED = 'token'.freeze
      EMPTY_CSS = '#dummy{}'.freeze

      TILER_WIDGET_TYPES = {
        'category': 'aggregation',
        'formula': 'formula',
        'histogram': 'histogram',
        'list': 'list',
        'time-series': 'histogram'
      }.freeze

      DATAVIEW_TEMPLATE_OPTIONS = [:column, :aggregation, :aggregationColumn, :aggregation_column].freeze

      def initialize(visualization)
        raise 'Carto::NamedMaps::Template needs a Carto::Visualization' unless visualization.is_a?(Carto::Visualization)

        @visualization = visualization
      end

      def to_hash
        @template ||= stats_aggregator.timing('named-map.template-data') do
          {
            name: name,
            auth: auth,
            version: NAMED_MAPS_VERSION,
            placeholders: placeholders,
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

      def to_json
        to_hash.to_json
      end

      def name
        (NAME_PREFIX + @visualization.id).gsub(/[^a-zA-Z0-9\-\_.]/, '').tr('-', '_')
      end

      private

      def placeholders
        placeholders = {}

        layers = @visualization.map.layers

        index = -1
        layers.select(&:carto_layer?).each do |layer|
          index += 1
          placeholders["layer#{index}".to_sym] = {
            type: 'number',
            default: layer.options[:visible] ? 1 : 0
          }
        end

        layers.select(&:torque?).each do |layer|
          index += 1
          placeholders["layer#{index}".to_sym] = {
            type: 'number',
            default: layer.options[:visible] ? 1 : 0
          }
        end

        placeholders
      end

      def layers
        layers = []
        index = -1 # forgive me for I have sinned

        @visualization.map.named_maps_layers.each do |layer|
          type, options = if layer.data_layer?
                            index += 1
                            type_and_options_for_cartodb_layers(layer, index)
                          elsif layer.basemap?
                            type_and_options_for_basemap_layers(layer)
                          end

          layers.push(type: type, options: options)
        end

        @visualization.map.layers.select(&:torque?).each do |layer|
          index += 1
          type, options = type_and_options_for_torque_layers(layer, index)

          layers.push(type: type, options: options)
        end

        layers
      end

      def sql(layer, index)
        layer_options = layer.options
        query = layer_options[:query]

        sql = if query.present?
                query
              else
                "SELECT * FROM #{@visualization.user.sql_safe_database_schema}.#{layer_options['table_name']}"
              end

        query_wrapper = layer_options[:query_wrapper]

        sql = query_wrapper.gsub('<%= sql %>', sql) if query_wrapper && layer.torque?

        "SELECT * FROM (#{sql}) AS wrapped_query WHERE <%= layer#{index} %>=1"
      end

      def type_and_options_for_cartodb_layers(layer, index)
        options = common_options_for_carto_and_torque_layers(layer, index)

        layer_options = layer.options
        layer_options_sql_wrap = layer_options[:sql_wrap]
        layer_options_query_wrapper = layer_options[:query_wrapper]

        options[:sql_wrap] = if layer_options_sql_wrap
                               layer_options_sql_wrap
                             elsif layer_options_query_wrapper
                               layer_options_query_wrapper
                             end

        ['cartodb', options]
      end

      def type_and_options_for_torque_layers(layer, index)
        ['torque', common_options_for_carto_and_torque_layers(layer, index)]
      end

      def common_options_for_carto_and_torque_layers(layer, index)
        layer_options = layer.options

        options = {
          cartocss: layer_options.fetch('tile_style').strip.empty? ? EMPTY_CSS : layer_options.fetch('tile_style'),
          cartocss_version: layer_options.fetch('style_version')
        }

        layer_options_source = layer_options[:source]
        if layer_options_source
          options[:source] = { id: layer_options_source }
        else
          options[:sql] = sql(layer, index)
        end

        layer_infowindow = layer.infowindow
        if layer_infowindow && layer_infowindow.fetch('fields') && !layer_infowindow.fetch('fields').empty?
          options[:interactivity] = layer_options[:interactivity]
          options[:attributes] = {
            id:       'cartodb_id',
            columns:  layer_infowindow['fields'].map { |field| field.fetch('name') }
          }
        end

        options
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

      def dataviews
        dataviews = {}

        @visualization.widgets.each do |widget|
          dataviews[widget.id.to_s] = dataview_data(widget)
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
        options = widget.options.select { |k, _v| DATAVIEW_TEMPLATE_OPTIONS.include?(k) }
        options[:aggregationColumn] = options[:aggregation_column]
        options.delete(:aggregation_column)

        dataview_data = {
          type: TILER_WIDGET_TYPES[widget.type.to_sym],
          options: options
        }

        dataview_data[:source] = { id: widget.source_id } if widget.source_id.present?

        dataview_data
      end

      def auth
        method, valid_tokens = if @visualization.password_protected?
                                 [AUTH_TYPE_SIGNED, generate_auth_token]
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

      def generate_auth_token
        SecureRandom.urlsafe_base64(nil, false)
      end
    end
  end
end
