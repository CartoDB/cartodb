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

      DATAVIEW_TEMPLATE_OPTIONS = [:column, :aggregation, :aggregationColumn, :aggregation_column, :operation].freeze

      def initialize(visualization)
        # TODO: Remove when it's safe to assume thais confussion wont' happen.
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
              analyses: analyses_definitions
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

        last_index, carto_layers_visibility_placeholders = layer_visibility_placeholders(layers.select(&:carto_layer?))
        _, torque_layer_visibility_placeholders = layer_visibility_placeholders(layers.select(&:torque?),
                                                                                starting_index: last_index)

        placeholders = placeholders.merge(carto_layers_visibility_placeholders)
        placeholders = placeholders.merge(torque_layer_visibility_placeholders)

        placeholders
      end

      def layer_visibility_placeholders(layers, starting_index: 0)
        placeholders = {}

        index = starting_index
        layers.each do |layer|
          placeholders["layer#{index}".to_sym] = {
            type: 'number',
            default: layer.options[:visible] ? 1 : 0
          }
          index += 1
        end

        [index, placeholders]
      end

      def layers
        layers = []
        layer_index = -1 # forgive me for I have sinned

        @visualization.map.named_maps_layers.each do |layer|
          if layer.data_layer?
            layer_index += 1

            layers.push(type: 'cartodb', options: options_for_cartodb_layers(layer, layer_index))
          elsif layer.base?
            layer_options = layer.options

            if layer_options['type'] == 'Plain'
              layers.push(type: 'plain', options: options_for_plain_basemap_layers(layer_options))
            else
              layers.push(type: 'http', options: options_for_http_basemap_layers(layer_options))
            end
          end
        end

        @visualization.map.torque_layers.each do |layer|
          layer_index += 1
          layers.push(type: 'torque', options: common_options_for_carto_and_torque_layers(layer, layer_index))
        end

        layers
      end

      def options_for_plain_basemap_layers(layer_options)
        layer_options['image'].present? ? { imageUrl: layer_options['image'] } : { color: layer_options['color'] }
      end

      def options_for_http_basemap_layers(layer_options)
        options = {}

        options[:urlTemplate] = layer_options['urlTemplate'] if layer_options['urlTemplate'].present?
        options[:subdomains] = layer_options['subdomains'] if layer_options['subdomains']

        options
      end

      def options_for_cartodb_layers(layer, index)
        options = common_options_for_carto_and_torque_layers(layer, index)

        layer_options = layer.options
        layer_options_sql_wrap = layer_options[:sql_wrap]
        layer_options_query_wrapper = layer_options[:query_wrapper]

        options[:sql_wrap] = layer_options_sql_wrap || layer_options_query_wrapper

        options
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
          options[:sql] = visibility_wrapped_sql(layer.wrapped_sql(@visualization.user), index)
        end

        attributes, interactivity = attributes_and_interactivity(layer.infowindow, layer.tooltip)

        options[:attributes] = attributes if attributes.present?
        options[:interactivity] = interactivity if interactivity.present?

        options
      end

      def visibility_wrapped_sql(sql, index)
        "SELECT * FROM (#{sql}) AS wrapped_query WHERE <%= layer#{index} %>=1"
      end

      def attributes_and_interactivity(layer_infowindow, layer_tooltip)
        click_fields = layer_infowindow['fields'] if layer_infowindow
        hover_fields = layer_tooltip['fields'] if layer_tooltip

        interactivity = []
        attributes = {}

        if hover_fields.present?
          interactivity << hover_fields.map { |hover_field| hover_field.fetch('name') }
        end

        if click_fields.present?
          interactivity << 'cartodb_id'

          attributes = {
            id: 'cartodb_id',
            columns: click_fields.map { |click_field| click_field.fetch('name') }
          }
        end

        [attributes, interactivity.join(',')]
      end

      def dataviews
        dataviews = {}

        @visualization.widgets.each do |widget|
          dataviews[widget.id.to_s] = dataview_data(widget)
        end

        dataviews
      end

      def analyses_definitions
        @visualization.analyses.map(&:analysis_definition)
      end

      def stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      def dataview_data(widget)
        options = widget.options.select { |k, _v| DATAVIEW_TEMPLATE_OPTIONS.include?(k) }
        options[:aggregationColumn] = options.delete(:aggregation_column)

        dataview_data = {
          type: TILER_WIDGET_TYPES[widget.type.to_sym],
          options: options
        }

        dataview_data[:source] = { id: widget.source_id } if widget.source_id.present?

        dataview_data
      end

      def auth
        method, valid_tokens = if @visualization.password_protected?
                                 [AUTH_TYPE_SIGNED, @visualization.user.get_auth_tokens]
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
    end
  end
end
