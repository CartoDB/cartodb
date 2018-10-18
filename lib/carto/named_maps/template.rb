# encoding: utf-8

module Carto
  module NamedMaps
    class Template
      NAMED_MAPS_VERSION = '0.0.1'.freeze
      MAP_CONFIG_VERSION = '1.5.0'.freeze
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
        # TODO: Remove when it's safe to assume this confussion won't happen.
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
              version: MAP_CONFIG_VERSION,
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

        layers = @visualization.layers

        last_index, carto_layers_visibility_placeholders = layer_visibility_placeholders(layers.select(&:carto?))
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

        is_builder = @visualization.builder?
        @visualization.named_map_layers.each do |layer|
          if layer.data_layer?
            layer_index += 1

            options = options_for_carto_and_torque_layers(layer, layer_index, is_builder)
            layers.push(id: layer.id, type: 'cartodb', options: options)
          elsif layer.base_layer?
            layer_options = layer.options

            if layer_options['type'] == 'Plain'
              layers.push(type: 'plain', options: options_for_plain_basemap_layers(layer_options))
            elsif !layer.gmapsbase?
              # Tiler doesn't support rendering Google basemaps in static images. We skip them to avoid errors in
              # dashboard previews, this way at least we get the data on a transparent background.
              layers.push(type: 'http', options: options_for_http_basemap_layers(layer_options))
            end
          end
        end

        @visualization.torque_layers.each do |layer|
          layer_index += 1

          options = options_for_carto_and_torque_layers(layer, layer_index, is_builder)
          layers.push(id: layer.id, type: 'torque', options: options)
        end

        layers
      end

      def options_for_plain_basemap_layers(layer_options)
        layer_options['image'].present? ? { imageUrl: layer_options['image'] } : { color: layer_options['color'] }
      end

      def options_for_http_basemap_layers(layer_options)
        options = {}

        options[:urlTemplate] = layer_options['urlTemplate'] if layer_options['urlTemplate'].present?
        options[:subdomains] = layer_options['subdomains'] if layer_options['subdomains'].present?
        options[:tms] = layer_options['tms'] if layer_options['tms'].present?

        options
      end

      def options_for_carto_and_torque_layers(layer, index, is_builder)
        layer_options = layer.options.with_indifferent_access
        tile_style = layer_options[:tile_style].strip if layer_options[:tile_style]

        options = {
          cartocss: tile_style.present? ? tile_style : EMPTY_CSS,
          cartocss_version: layer_options.fetch('style_version')
        }

        layer_options_source = layer_options[:source]
        if is_builder && layer_options_source
          options[:source] = { id: layer_options_source }
        else
          options[:sql] = visibility_wrapped_sql(layer.default_query(@visualization.user), index)
        end

        options[:sql_wrap] = layer_options[:sql_wrap] || layer_options[:query_wrapper]

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
        @visualization.analyses.map(&:analysis_definition_for_api)
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
        visualization_for_auth = @visualization.non_mapcapped

        method, valid_tokens = if visualization_for_auth.password_protected?
                                 [AUTH_TYPE_SIGNED, [visualization_for_auth.get_auth_token]]
                               elsif visualization_for_auth.is_privacy_private?
                                 [AUTH_TYPE_SIGNED, visualization_for_auth.allowed_auth_tokens]
                               else
                                 [AUTH_TYPE_OPEN, nil]
                               end

        auth = { method: method }
        auth[:valid_tokens] = valid_tokens if valid_tokens

        auth
      end

      def view
        valid_state? ? view_from_state : view_from_map
      end

      def preview_layers
        preview_layers = {}

        @visualization.data_layers.each do |layer|
          preview_layers[:"#{layer.id}"] = layer.options[:visible] || false
        end

        preview_layers
      end

      def valid_state?
        state = @visualization.state.json
        map = state[:map]
        state.present? && map.present? && map[:center].present? && map[:sw].present? && map[:ne].present? &&
          map[:sw][0].present? && map[:sw][1].present? && map[:ne][0].present? && map[:ne][1].present?
      end

      def view_from_map
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
        filter_and_merge_view(bounds_data, data)
      end

      def view_from_state
        state = @visualization.state.json
        center_data = state[:map][:center]
        center_and_zoom = {
            zoom: state[:map][:zoom],
            center: {
              lng: center_data[1],
              lat: center_data[0]
            }
        }
        bounds_data = {
            west: state[:map][:sw][0],
            south: state[:map][:sw][1],
            east: state[:map][:ne][0],
            north: state[:map][:ne][1]
        }
        filter_and_merge_view(bounds_data, center_and_zoom)
      end

      def filter_and_merge_view(bounds_data, center_and_zoom)
        # INFO: Don't return 'bounds' if any of the points is 0 to avoid static map trying to go too small zoom level
        if bounds_data[:west] != 0 || bounds_data[:south] != 0 || bounds_data[:east] != 0 || bounds_data[:north] != 0
          center_and_zoom[:bounds] = bounds_data
        end

        center_and_zoom.merge!(preview_layers: preview_layers)
      end
    end
  end
end
