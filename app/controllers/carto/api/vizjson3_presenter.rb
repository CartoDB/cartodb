require_dependency 'carto/api/layer_vizjson_adapter'
require_dependency 'cartodb/redis_vizjson_cache'

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

        if display_named_map?(@visualization, forced_privacy_version)
          vizjson[:analyses] = @visualization.analyses.map { |a| named_map_analysis_json(a) }
        else
          vizjson[:analyses] = @visualization.analyses.map(&:analysis_definition_json)
        end

        auth_tokens = @visualization.needed_auth_tokens
        vizjson[:auth_tokens] = auth_tokens unless auth_tokens.empty?

        children_vizjson = @visualization.children.map do |child|
          VizJSON3Presenter.new(child, @redis_vizjson_cache)
                           .to_vizjson(https_request: options[:https_request], vector: options[:vector])
        end
        vizjson[:slides] = children_vizjson unless children_vizjson.empty?

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

        if display_named_map?(@visualization, forced_privacy_version)
          presenter_options = {
            user_name: options.fetch(:user_name),
            https_request: options.fetch(:https_request, false),
            owner: @visualization.user
          }
          named_maps_presenter = VizJSON3NamedMapPresenter.new(
            @visualization, layer_group_for_named_map(options), presenter_options, configuration)
          layers_data.push(named_maps_presenter.to_vizjson)
        else
          named_maps_presenter = nil
          layers_data.push(layer_group_for(options))
        end

        layers_data.push(other_layers_vizjson(options, named_maps_presenter))

        layers_data += non_basemap_base_layers_for(options)

        layers_data.compact.flatten
      end

      def layer_group_for_named_map(options)
        layer_group_poro = layer_group_for(options)
        # If there is *only* a torque layer, there is no layergroup
        return {} unless layer_group_poro

        layers_data = Array.new
        layer_num = 0
        layer_group_poro[:options][:layer_definition][:layers].each do |layer|
          layers_data.push(type:       layer[:type],
                           options:    layer[:options],
                           visible:    layer[:visible],
                           index:      layer_num
                          )
          layer_num += 1
        end
        layers_data
      end

      def layer_group_for(options)
        VizJSON3LayerGroupPresenter.new(@visualization.data_layers, options, configuration).to_vizjson
      end

      def other_layers_vizjson(options, named_maps_presenter = nil)
        layer_index = @visualization.data_layers.size

        @visualization.other_layers.map do |layer|
          decoration_data_to_apply = if named_maps_presenter
                                       named_maps_presenter.get_decoration_for_layer(layer.kind, layer_index)
                                     else
                                       {}
                                     end
          layer_index += 1
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
        analysis_definition_json_without_sources(analysis.analysis_definition_json)
      end

      def analysis_definition_json_without_sources(analysis_definition_json)
        if analysis_definition_json[:type] == 'source'
          analysis_definition_json.delete(:params)
        elsif analysis_definition_json[:params] && analysis_definition_json[:params][:source]
          analysis_definition_json_without_sources(analysis_definition_json[:params][:source])
        end
        analysis_definition_json
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
          ds[:template_name] = CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.id)
        end

        ds
      end

      def user_info_vizjson(user)
        {
          fullname: user.name.present? ? user.name : user.username,
          avatar_url: user.avatar_url
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

    class VizJSON3NamedMapPresenter
      include ApiTemplates

      NAMED_MAP_TYPE = 'namedmap'.freeze
      LAYER_TYPES_TO_DECORATE = ['torque'].freeze
      DEFAULT_TILER_FILTER = 'mapnik'.freeze

      # @throws NamedMapsPresenterError
      def initialize(visualization, layergroup, options, configuration)
        @visualization    = visualization
        @options          = options
        @configuration    = configuration
        @layergroup_data  = layergroup
        @named_map_name   = CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.id)
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
      # @throws NamedMapsPresenterError
      def to_vizjson
        return nil if @visualization.data_layers.empty? # When there are no layers don't return named map data

        privacy_type = @visualization.password_protected? ? API_TEMPLATE_PRIVATE : api_templates_type(@options)

        {
          type: NAMED_MAP_TYPE,
          order: 1,
          options: {
            type: NAMED_MAP_TYPE,
            user_name: @options.fetch(:user_name),
            maps_api_template: ApplicationHelper.maps_api_template(privacy_type),
            sql_api_template: ApplicationHelper.sql_api_template(privacy_type),
            filter: @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
            named_map: {
              name: @named_map_name,
              stat_tag: @visualization.id,
              params: placeholders_data,
              layers: configure_layers_data
            },
            attribution: @visualization.attributions_from_derived_visualizations.join(', ')
          }
        }
      end

      # Prepares additional data to decorate layers in the LAYER_TYPES_TO_DECORATE list
      # - Parameters set inside as nil will remove the field itself from the layer data
      # @throws NamedMapsPresenterError
      def get_decoration_for_layer(layer_type, layer_index)
        return {} unless LAYER_TYPES_TO_DECORATE.include? layer_type

        {
          named_map: {
            name:         @named_map_name,
            layer_index:  layer_index,
            params:       placeholders_data
          },
          query: nil # do not expose SQL query on Torque layers with named maps
        }
      end

      private

      def placeholders_data
        data = {}
        @layergroup_data.each do |layer|
          data["layer#{layer[:index]}".to_sym] = layer[:visible] ? 1 : 0
        end
        data
      end

      # Extract relevant information from layers
      def configure_layers_data
        # Http/base layers don't appear at viz.json
        layers = @visualization.data_layers
        layers_data = Array.new
        layers.each do |layer|
          layer_vizjson = VizJSON3LayerPresenter.new(layer, @options, @configuration).to_vizjson
          layers_data.push(data_for_carto_layer(layer_vizjson))
        end
        layers_data
      end

      def data_for_carto_layer(layer_vizjson)
        data = {
          id: layer_vizjson[:id],
          layer_name: layer_vizjson[:options][:layer_name],
          interactivity: layer_vizjson[:options][:interactivity],
          visible: layer_vizjson[:visible]
        }

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

    class VizJSON3LayerGroupPresenter
      include ApiTemplates

      LAYER_GROUP_VERSION = '3.0.0'.freeze
      DEFAULT_TILER_FILTER = 'mapnik'.freeze

      def initialize(layers, options, configuration)
        @layers         = layers
        @options        = options
        @configuration  = configuration
      end

      def to_vizjson
        return nil if cartodb_layers.empty?

        {
          type:               'layergroup',
          options:            {
            user_name:          @options.fetch(:user_name),
            maps_api_template:  ApplicationHelper.maps_api_template(api_templates_type(@options)),
            sql_api_template:   ApplicationHelper.sql_api_template(api_templates_type(@options)),
            filter:             @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
            layer_definition:   {
              stat_tag:           @options.fetch(:visualization_id),
              version:            LAYER_GROUP_VERSION,
              layers:             cartodb_layers
            },
            attribution: @options.fetch(:attributions).join(', ')
          }
        }
      end

      private

      def cartodb_layers
        @cartodb_layers ||= @layers.map do |layer|
          VizJSON3LayerPresenter.new(layer, @options, @configuration).to_vizjson
        end
      end
    end

    class VizJSON3LayerPresenter
      include ApiTemplates

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
      ).freeze

      INFOWINDOW_AND_TOOLTIP_KEYS = %w(fields template_name template alternative_names width maxHeight).freeze

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
            infowindow: whitelisted_attrs(with_template(@layer.infowindow, 'infowindows')),
            tooltip:    whitelisted_attrs(with_template(@layer.tooltip, 'tooltips')),
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

        torque
      end

      MUSTACHE_ROOT_PATH = 'lib/assets/javascripts/cartodb3/mustache-templates'.freeze

      def with_template(templated_element, mustache_dir)
        return nil if templated_element.nil?

        template = templated_element['template']
        return templated_element if !template.nil? && !template.empty?

        templated_sym = templated_element.deep_symbolize_keys
        templated_element[:template] = get_template(
          templated_sym[:template_name],
          templated_sym[:template],
          "#{MUSTACHE_ROOT_PATH}/#{mustache_dir}/#{get_template_name(templated_sym[:template_name])}.jst.mustache")
        templated_element
      end

      def get_template_name(name)
        Carto::Layer::TEMPLATES_MAP.fetch(name, name)
      end

      def get_template(template_name, fallback_template, template_path)
        if template_name.present?
          path = Rails.root.join(template_path)
          File.read(path)
        else
          fallback_template
        end
      end

      def options_data
        if @options[:full]
          decorate_with_data(@layer.options, @decoration_data)
        else
          data = {
            layer_name:         layer_name,
            cartocss:           css_from(@layer.options),
            cartocss_version:   @layer.options.fetch('style_version'),
            interactivity:      @layer.options.fetch('interactivity')
          }
          source = @layer.options['source']
          if source
            data[:source] = source
            data.delete(:sql)
          else
            data[:sql] = wrap(sql_from(@layer.options), @layer.options)
          end
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
