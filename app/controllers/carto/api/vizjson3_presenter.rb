require_dependency 'carto/api/layer_vizjson_adapter'
require_dependency 'carto/api/infowindow_migrator'
require_dependency 'cartodb/redis_vizjson_cache'
require_dependency 'carto/named_maps/template'
require_dependency 'carto/legend_migrator'
require_dependency 'carto/html_safe'

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
      include Carto::HtmlSafe

      def initialize(visualization,
                     redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new($tables_metadata, 3))
        @visualization = visualization
        @redis_vizjson_cache = redis_vizjson_cache
      end

      def to_vizjson(https_request: false)
        generate_vizjson(https_request: https_request, forced_privacy_version: nil)
      end

      def to_named_map_vizjson(https_request: false)
        generate_vizjson(https_request: https_request, forced_privacy_version: :force_named)
      end

      def to_anonymous_map_vizjson(https_request: false)
        generate_vizjson(https_request: https_request, forced_privacy_version: :force_anonymous)
      end

      private

      def generate_vizjson(https_request:, forced_privacy_version:)
        https_request ||= false
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
                      calculate_vizjson(https_request: https_request, forced_privacy_version: forced_privacy_version)
                    end
                  else
                    calculate_vizjson(https_request: https_request, forced_privacy_version: forced_privacy_version)
                  end

        vizjson
      end

      VIZJSON_VERSION = '3.0.0'.freeze

      def calculate_vizjson(https_request: false, forced_privacy_version: nil)
        options = { https_request: https_request }

        user = @visualization.user
        map = @visualization.map

        vizjson = {
          bounds:         bounds_from(map),
          center:         map.center,
          datasource:     datasource_vizjson(options, forced_privacy_version),
          description:    markdown_html_safe(@visualization.description),
          options:        map_options(@visualization),
          id:             @visualization.id,
          layers:         layers_vizjson(forced_privacy_version),
          likes:          @visualization.likes.count,
          map_provider:   map.provider,
          overlays:       overlays_vizjson(@visualization),
          title:          @visualization.qualified_name(user),
          updated_at:     @visualization.updated_at,
          user:           user_info_vizjson(user),
          version:        VIZJSON_VERSION,
          widgets:        widgets_vizjson,
          zoom:           map.zoom
        }

        visualization_analyses = @visualization.analyses
        vizjson[:analyses] = if display_named_map?(@visualization, forced_privacy_version)
                               visualization_analyses.map { |a| named_map_analysis_json(a) }
                             else
                               visualization_analyses.map(&:analysis_definition)
                             end

        vizjson
      end

      def bounds_from(map)
        return nil unless map.view_bounds_sw && map.view_bounds_ne

        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue => e
        CartoDB::Logger.debug(
          message: "Error parsing map bounds: #{map.id}, #{map.view_bounds_sw}, #{map.view_bounds_ne}", exception: e)
        nil
      end

      def layers_vizjson(forced_privacy_version)
        ordered_layers = (
          [basemap_layer] +
          @visualization.carto_layers +
          @visualization.other_layers +
          non_basemap_base_layers).compact

        if display_named_map?(@visualization, forced_privacy_version)
          named_map_vizjson_for_layers(ordered_layers)
        else
          anonymous_vizjson_for_layers(ordered_layers)
        end
      end

      def named_map_vizjson_for_layers(layers)
        layers.map do |layer|
          VizJSON3NamedMapLayerPresenter.new(layer, configuration).to_vizjson
        end
      end

      def anonymous_vizjson_for_layers(layers)
        layers.map do |layer|
          VizJSON3LayerPresenter.new(layer, configuration).to_vizjson
        end
      end

      def basemap_layer
        @visualization.user_layers.first
      end

      def non_basemap_base_layers
        base_layers = @visualization.user_layers
        base_layers.empty? ? [] : base_layers.slice(1, base_layers.length)
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
          fullname: user.name_or_username,
          avatar_url: user.avatar_url,
          profile_url: user.public_url
        }
      end

      def widgets_vizjson
        @visualization.widgets.map do |widget|
          Carto::Api::WidgetPresenter.new(widget).to_vizjson
        end
      end

      def map_options(visualization)
        map = visualization.map

        migration_options = { layer_selector: true } if visualization.overlays.any? { |o| o.type == 'layer_selector' }

        map.options.merge(migration_options || {})
      end

      def overlays_vizjson(visualization)
        visualization.overlays.
          reject { |o| o.type == 'layer_selector' }.
          map { |o| Carto::Api::OverlayPresenter.new(o).to_vizjson }
      end
    end

    class VizJSON3NamedMapLayerPresenter
      include ApiTemplates

      def initialize(layer, configuration)
        @configuration      = configuration
        @layer              = layer
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/carto.js/blob/privacy-maps/doc/vizjson_format.md
      def to_vizjson
        layer_vizjson = VizJSON3LayerPresenter.new(@layer, @configuration).to_vizjson
        if @layer.user_layer?
          layer_vizjson
        elsif layer_vizjson[:type] == 'torque'
          data_for_torque_layer(layer_vizjson)
        else
          data_for_carto_layer(layer_vizjson)
        end
      end

      private

      def data_for_torque_layer(layer_vizjson)
        layer_vizjson.delete(:sql)
        layer_vizjson
      end

      def data_for_carto_layer(layer_vizjson)
        layer_options = layer_vizjson[:options]
        data = {
          id: layer_vizjson[:id],
          type: layer_vizjson[:type],
          visible: layer_vizjson[:visible],
          options: {
            layer_name: layer_options[:layer_name],
            attribution: layer_options[:attribution],
            cartocss: layer_options[:cartocss]
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

        data[:legends] = layer_vizjson[:legends] || []

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

      def initialize(layer, configuration = {})
        @layer            = layer
        @configuration    = configuration
      end

      def to_vizjson
        vizjson = { id: @layer.id }

        if @layer.base_layer?
          vizjson.merge(as_base)
        else
          vizjson.merge(as_data).merge(@layer.torque? ? as_torque : as_carto)
        end
      end

      private

      def attribution
        @layer.user_tables.map(&:visualization).map(&:attributions).join(', ')
      end

      def as_data
        old_legend_not_migrated = @layer.legend && !@layer.legend[:migrated]

        if @layer.persisted? && old_legend_not_migrated
          @layer.legends.any? ? mark_old_legend_migrated : migrate_old_legend
        end

        legends_presentation = @layer.legends.map do |legend|
          Carto::Api::LegendPresenter.new(legend).to_hash
        end

        { legends: legends_presentation }
      end

      def migrate_old_legend
        Carto::LegendMigrator.new(@layer.id, @layer.legend).build.save
        mark_old_legend_migrated
        @layer.legends.reload
      end

      def mark_old_legend_migrated
        @layer.options[:legend][:migrated] = true
        @layer.save
      end

      def as_torque
        layer_options = @layer.options.deep_symbolize_keys
        torque_options = layer_options.select { |k| TORQUE_ATTRS.include? k }
        torque_options[:attribution] = attribution
        torque_options[:layer_name] = layer_name

        torque = {
          type: 'torque',
          options: torque_options
        }

        torque[:cartocss] = layer_options[:tile_style]
        torque[:cartocss_version] = layer_options[:style_version]
        torque[:sql] = sql_from(@layer)

        if @layer.options['source'].present?
          torque[:source] = @layer.options['source']
        end

        sql_wrap = @layer.options['sql_wrap'] || @layer.options['query_wrapper']
        torque[:sql_wrap] = sql_wrap if sql_wrap

        torque
      end

      def as_carto
        {
          type:       'CartoDB',
          infowindow: whitelisted_attrs(migrate_builder_infowindow(@layer.infowindow, mustache_dir: 'infowindows')),
          tooltip:    whitelisted_attrs(migrate_builder_infowindow(@layer.tooltip, mustache_dir: 'tooltips')),
          visible:    @layer.options['visible'],
          options:    options_data
        }
      end

      def as_base
        {
          type:    @layer.kind,
          options: @layer.options
        }
      end

      def options_data
        data = {
          layer_name:         layer_name,
          cartocss:           css_from(@layer.options),
          cartocss_version:   @layer.options.fetch('style_version'),
          attribution:        attribution
        }
        source = @layer.options['source']
        if source
          data[:source] = source
          data.delete(:sql)
        else
          data[:sql] = sql_from(@layer)
        end

        sql_wrap = @layer.options['sql_wrap'] || @layer.options['query_wrapper']
        data[:sql_wrap] = sql_wrap if sql_wrap

        data
      end

      def layer_name
        layer_alias = @layer.options.fetch('table_name_alias', nil)
        table_name  = @layer.options.fetch('table_name')

        # .present? is not valid, as we want to allow whitespaced layer names.
        layer_alias.nil? || layer_alias.empty? ? table_name : layer_alias
      end

      def sql_from(layer)
        query = layer.options.fetch('query', '')
        query.present? ? query : layer.default_query(layer.visualization.user)
      end

      def css_from(options)
        style = options.include?('tile_style') ? options['tile_style'] : nil
        (style.nil? || style.strip.empty?) ? EMPTY_CSS : options.fetch('tile_style')
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
