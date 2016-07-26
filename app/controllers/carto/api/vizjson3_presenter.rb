require_dependency 'carto/api/layer_vizjson_adapter'
require_dependency 'carto/api/infowindow_migrator'
require_dependency 'cartodb/redis_vizjson_cache'
require_dependency 'carto/named_maps/template'

module Carto
  module Api
    module ApiTemplates
      API_TEMPLATE_PUBLIC = 'public'.freeze
      API_TEMPLATE_PRIVATE = 'private'.freeze

      def api_templates_type(options)
        options.fetch(:https_request, false) ? API_TEMPLATE_PRIVATE : API_TEMPLATE_PUBLIC
      end
    end

    module DisplayVizjsonMode
      def display_named_map?(visualization, forced_privacy_version)
        forced_privacy_version != :force_anonymous && (visualization.retrieve_named_map? || forced_privacy_version == :force_named)
      end
    end

    class VizJSON3Presenter
      include ApiTemplates
      include DisplayVizjsonMode

      def initialize(visualization,
                     redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new($tables_metadata, 3))
        @visualization = visualization
        @redis_vizjson_cache = redis_vizjson_cache
      end

      def to_vizjson(https_request: false, vector: false)
        generate_vizjson(https_request: https_request, vector: vector, forced_privacy_version: nil)
      end

      def to_named_map_vizjson(https_request: false, vector: false)
        generate_vizjson(https_request: https_request, vector: vector, forced_privacy_version: :force_named)
      end

      def to_anonymous_map_vizjson(https_request: false, vector: false)
        generate_vizjson(https_request: https_request, vector: vector, forced_privacy_version: :force_anonymous)
      end

      private

      def generate_vizjson(https_request:, vector:, forced_privacy_version:)
        https_request ||= false
        vector ||= false
        version = case forced_privacy_version
                  when :force_named
                    '3n'
                  when :force_anonymous
                    '3a'
                  else
                    3
                  end

        vizjson = if @redis_vizjson_cache
                    @redis_vizjson_cache.cached(@visualization.id, https_request, version) do
                      calculate_vizjson(https_request: https_request, vector: vector, forced_privacy_version: forced_privacy_version)
                    end
                  else
                    calculate_vizjson(https_request: https_request, vector: vector, forced_privacy_version: forced_privacy_version)
                  end

        vizjson[:vector] = vector

        vizjson
      end

      VIZJSON_VERSION = '3.0.0'.freeze

      def default_options
        user = @visualization.user

        {
          full: false,
          visualization_id: @visualization.id,
          https_request: false,
          attributions: @visualization.attributions_from_derived_visualizations,
          user_name: user.username,
          user: user,
          vector: false
        }
      end

      def calculate_vizjson(https_request: false, vector: false, forced_privacy_version: nil)
        options = default_options.merge(https_request: https_request, vector: vector)

        user = @visualization.user
        map = @visualization.map

        vizjson = {
          id:             @visualization.id,
          version:        VIZJSON_VERSION,
          title:          @visualization.qualified_name(user),
          likes:          @visualization.likes.count,
          description:    html_safe(@visualization.description),
          scrollwheel:    map.scrollwheel,
          legends:        map.legends,
          map_provider:   map.provider,
          bounds:         bounds_from(map),
          center:         map.center,
          zoom:           map.zoom,
          updated_at:     map.viz_updated_at,
          layers:         layers_vizjson(options, forced_privacy_version),
          overlays:       @visualization.overlays.map { |o| Carto::Api::OverlayPresenter.new(o).to_vizjson },
          prev:           @visualization.prev_id,
          next:           @visualization.next_id,
          transition_options: @visualization.transition_options,
          widgets:        widgets_vizjson,
          datasource:     datasource_vizjson(options, forced_privacy_version),
          user:           user_info_vizjson(user)
        }

        visualization_analyses = @visualization.analyses
        vizjson[:analyses] = if display_named_map?(@visualization, forced_privacy_version)
                               visualization_analyses.map { |a| named_map_analysis_json(a) }
                             else
                               visualization_analyses.map(&:analysis_definition)
                             end

        auth_tokens = @visualization.needed_auth_tokens
        vizjson[:auth_tokens] = auth_tokens unless auth_tokens.empty?

        parent = @visualization.parent
        if parent
          vizjson[:title] = parent.qualified_name(user)
          vizjson[:description] = html_safe(parent.description)
        end

        vizjson
      end

      def bounds_from(map)
        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue => e
        CartoDB::Logger.debug(
          message: "Error parsing map bounds: #{map.id}, #{map.view_bounds_sw}, #{map.view_bounds_ne}", exception: e)
        nil
      end

      def layers_vizjson(options, forced_privacy_version)
        basemap_layer = basemap_layer_vizjson(options)
        layers_data = []
        layers_data.push(basemap_layer) if basemap_layer

        display_named_map = display_named_map?(@visualization, forced_privacy_version)
        if display_named_map
          presenter_options = {
            user_name: options.fetch(:user_name),
            https_request: options.fetch(:https_request, false),
            owner: @visualization.user
          }
          @visualization.data_layers.map do |layer|
            layers_data.push(VizJSON3NamedMapLayerPresenter.new(layer, presenter_options, configuration).to_vizjson)
          end
        else
          @visualization.data_layers.map do |layer|
            layers_data.push(VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson)
          end
        end

        layers_data.push(other_layers_vizjson(options, display_named_map))

        layers_data += non_basemap_base_layers_for(options)

        layers_data.compact.flatten
      end

      def other_layers_vizjson(options, display_named_map)
        @visualization.other_layers.map do |layer|
          decoration_data_to_apply = if display_named_map
                                       { query: nil } # Remove torque layer query in named maps
                                     else
                                       {}
                                     end
          VizJSON3LayerPresenter.new(layer, options, configuration, decoration_data_to_apply).to_vizjson
        end
      end

      def basemap_layer_vizjson(options)
        layer = @visualization.user_layers.first
        VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson if layer
      end

      def non_basemap_base_layers_for(options)
        base_layers = @visualization.user_layers
        if base_layers.empty?
          []
        else
          # Remove the basemap, which is always first
          base_layers.slice(1, base_layers.length).map do |layer|
            VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson
          end
        end
      end

      def named_map_analysis_json(analysis)
        analysis_definition_without_sources(analysis.analysis_definition)
      end

      def analysis_definition_without_sources(analysis_definition)
        if analysis_definition[:type] == 'source'
          analysis_definition.delete(:params)
        elsif analysis_definition[:params] && analysis_definition[:params][:source]
          analysis_definition_without_sources(analysis_definition[:params][:source])
        end
        analysis_definition
      end

      def configuration
        Cartodb.config
      end

      def datasource_vizjson(options, forced_privacy_version)
        ds = {
          user_name: @visualization.user.username,
          maps_api_template: ApplicationHelper.maps_api_template(api_templates_type(options)),
          stat_tag: @visualization.id
        }

        if display_named_map?(@visualization, forced_privacy_version)
          ds[:template_name] = Carto::NamedMaps::Template.new(@visualization).name
        end

        ds
      end

      def user_info_vizjson(user)
        {
          fullname: user.name.present? ? user.name : user.username,
          avatar_url: user.avatar_url,
          profile_url: user.public_url
        }
      end

      def widgets_vizjson
        @visualization.widgets.map do |widget|
          Carto::Api::WidgetPresenter.new(widget).to_vizjson
        end
      end

      def html_safe(string)
        if string.present?
          renderer = Redcarpet::Render::Safe
          markdown = Redcarpet::Markdown.new(renderer, {})
          markdown.render string
        end
      end
    end

    class VizJSON3NamedMapLayerPresenter
      include ApiTemplates

      def initialize(layer, options, configuration)
        @options            = options
        @configuration      = configuration
        @layer              = layer
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
      def to_vizjson
        layer_vizjson = VizJSON3LayerPresenter.new(@layer, @options, @configuration).to_vizjson
        data_for_carto_layer(layer_vizjson)
      end

      private

      def data_for_carto_layer(layer_vizjson)
        layer_options = layer_vizjson[:options]
        data = {
          id: layer_vizjson[:id],
          type: layer_vizjson[:type],
          layer_name: layer_options[:layer_name],
          interactivity: layer_options[:interactivity],
          visible: layer_vizjson[:visible],
          options: {
            attribution: layer_options[:attribution]
          }
        }

        if layer_options && layer_options[:source]
          data[:options][:source] = layer_options[:source]
        end

        infowindow = layer_vizjson[:infowindow]
        if infowindow && infowindow['fields'] && !infowindow['fields'].empty?
          data[:infowindow] = infowindow
        end

        tooltip = layer_vizjson[:tooltip]
        if tooltip && tooltip['fields'] && !tooltip['fields'].empty?
          data[:tooltip] = tooltip
        end

        legend = layer_vizjson[:legend]
        if legend && legend['type'] != 'none'
          data[:legend] = legend
        end

        data
      end
    end

    class VizJSON3LayerPresenter
      include ApiTemplates
      include InfowindowMigrator

      EMPTY_CSS = '#dummy{}'.freeze

      TORQUE_ATTRS = %i(
        table_name
        user_name
        property
        blendmode
        resolution
        countby
        torque-duration
        torque-steps
        torque-blend-mode
        named_map
        visible
        attribution
      ).freeze

      INFOWINDOW_AND_TOOLTIP_KEYS = %w(
        fields template_name template template_type alternative_names width maxHeight headerColor
      ).freeze

      def initialize(layer, options = {}, configuration = {}, decoration_data = {})
        @layer            = layer
        @options          = options
        @configuration    = configuration
        @decoration_data  = decoration_data
      end

      def to_vizjson
        if @layer.base?
          with_kind_as_type(@layer.public_values)
        elsif @layer.torque?
          as_torque
        else
          {
            id:         @layer.id,
            type:       'CartoDB',
            infowindow: whitelisted_attrs(migrate_builder_infowindow(@layer.infowindow, mustache_dir: 'infowindows')),
            tooltip:    whitelisted_attrs(migrate_builder_infowindow(@layer.tooltip, mustache_dir: 'tooltips')),
            legend:     @layer.legend,
            order:      @layer.order,
            visible:    @layer.public_values[:options]['visible'],
            options:    options_data
          }
        end
      end

      private

      # Decorates the layer presentation with data if needed. nils on the decoration act as removing the field
      def decorate_with_data(source_hash, decoration_data)
        decoration_data.each do |key, value|
          source_hash[key] = value
          source_hash.delete_if do |_, v|
            v.nil?
          end
        end
        source_hash
      end

      def with_kind_as_type(attributes)
        decorate_with_data(attributes.merge(type: attributes.delete(:kind)), @decoration_data)
      end

      def as_torque
        layer_options = decorate_with_data(
          # Make torque always have a SQL query too (as vizjson v2)
          @layer.options.deep_symbolize_keys.merge(query: wrap(sql_from(@layer.options), @layer.options)),
          @decoration_data
        )

        torque = {
          id:         @layer.id,
          type:       'torque',
          order:      @layer.order,
          legend:     @layer.legend,
          options:    {
            stat_tag:           @options.fetch(:visualization_id),
            maps_api_template: ApplicationHelper.maps_api_template(api_templates_type(@options)),
            sql_api_template: ApplicationHelper.sql_api_template(api_templates_type(@options))
          }.merge(layer_options.select { |k| TORQUE_ATTRS.include? k })
        }

        torque[:cartocss] = layer_options[:tile_style]

        torque[:cartocss_version] = @layer.options['style_version'] if @layer

        torque[:sql] = if layer_options[:query].present? || @layer.nil?
                         layer_options[:query]
                       else
                         @layer.options['query']
                       end

        torque[:source] = @layer.options['source'] if @layer.options['source'].present?

        torque
      end

      def options_data
        if @options[:full]
          decorate_with_data(@layer.options, @decoration_data)
        else
          data = {
            layer_name:         layer_name,
            cartocss:           css_from(@layer.options),
            cartocss_version:   @layer.options.fetch('style_version'),
            interactivity:      @layer.options.fetch('interactivity'),
            attribution:        @layer.options.fetch('attribution', '')
          }
          source = @layer.options['source']
          if source
            data[:source] = source
            data.delete(:sql)
          else
            data[:sql] = wrap(sql_from(@layer.options), @layer.options)
          end

          sql_wrap = @layer.options['sql_wrap'] || @layer.options['query_wrapper']
          data[:sql_wrap] = sql_wrap if sql_wrap

          data = decorate_with_data(data, @decoration_data)

          data
        end
      end

      def layer_name
        layer_alias = @layer.options.fetch('table_name_alias', nil)
        table_name  = @layer.options.fetch('table_name')

        return table_name unless layer_alias && !layer_alias.empty?
        layer_alias
      end

      def sql_from(options)
        query = options.fetch('query', '')
        return default_query_for(options) if query.nil? || query.empty?
        query
      end

      def css_from(options)
        style = options.include?('tile_style') ? options['tile_style'] : nil
        (style.nil? || style.strip.empty?) ? EMPTY_CSS : options.fetch('tile_style')
      end

      def wrap(query, options)
        wrapper = options.fetch('query_wrapper', nil)
        return query if wrapper.nil? || wrapper.empty?
        EJS.evaluate(wrapper, sql: query)
      end

      def default_query_for(layer_options)
        "select * from #{layer_options.fetch('table_name')}"
      end

      def public_options
        return @configuration if @configuration.empty?
        @configuration.fetch(:layer_opts).fetch("public_opts")
      end

      def whitelisted_attrs(infowindow_or_tooltip)
        if infowindow_or_tooltip
          infowindow_or_tooltip.select do |key, _|
            INFOWINDOW_AND_TOOLTIP_KEYS.include?(key) || INFOWINDOW_AND_TOOLTIP_KEYS.include?(key.to_s)
          end
        end
      end
    end
  end
end
