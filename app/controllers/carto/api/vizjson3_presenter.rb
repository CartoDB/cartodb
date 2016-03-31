require_dependency 'carto/api/layer_vizjson_adapter'
require_dependency 'cartodb/redis_vizjson_cache'

module Carto
  module Api
    class VizJSON3Presenter
      def initialize(visualization,
                     viewer_user,
                     redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new($tables_metadata, 3))
        @visualization = visualization
        @viewer_user = viewer_user
        @map = visualization.map
        @redis_vizjson_cache = redis_vizjson_cache
      end

      def to_vizjson(**options)
        @redis_vizjson_cache.cached(@visualization.id, options.fetch(:https_request, false)) do
          calculate_vizjson(options)
        end
      end

      private

      attr_reader :visualization, :map

      VIZJSON_VERSION = '3.0.0'.freeze

      def default_options
        {
          full: true,
          visualization_id: visualization.id,
          https_request: false,
          attributions: visualization.attributions_from_derived_visualizations
        }
      end

      def add_default_options(options = {})
        default_options.merge(
          full: false,
          user_name: user.username,
          user_api_key: user.api_key,
          user: user,
          viewer_user: @viewer_user
        ).merge(options)
      end

      def calculate_vizjson(options = {})
        options = add_default_options(options)

        vizjson = {
          id:             visualization.id,
          version:        VIZJSON_VERSION,
          title:          visualization.qualified_name(user),
          likes:          visualization.likes.count,
          description:    html_safe(visualization.description),
          scrollwheel:    map.scrollwheel,
          legends:        map.legends,
          url:            options.delete(:url),
          map_provider:   map.provider,
          bounds:         bounds_from(map),
          center:         map.center,
          zoom:           map.zoom,
          updated_at:     map.viz_updated_at,
          layers:         layers_for(visualization, options),
          overlays:       overlays_for(visualization),
          prev:           visualization.prev_id,
          next:           visualization.next_id,
          transition_options: visualization.transition_options,
          widgets:        widgets,
          datasource:     datasource(options),
          user:           user_vizjson_info,
          vector:         options.fetch(:vector, false)
        }

        auth_tokens = @visualization.needed_auth_tokens
        vizjson[:auth_tokens] = auth_tokens unless auth_tokens.empty?

        children_vizjson = children_for(@visualization, options)
        vizjson[:slides] = children_vizjson unless children_vizjson.empty?

        unless visualization.parent_id.nil?
          vizjson[:title] = visualization.parent.qualified_name(user)
          vizjson[:description] = html_safe(visualization.parent.description)
        end

        vizjson
      end

      def children_for(visualization, options)
        visualization.children.map do |child|
          VizJSON3Presenter.new(child, @viewer_user, @redis_vizjson_cache).to_vizjson(options)
        end
      end

      def overlays_for(visualization)
        visualization.overlays.to_a.map do |overlay|
          Carto::Api::OverlayPresenter.new(overlay).to_vizjson_poro
        end
      end

      def bounds_from(map)
        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue => e
        CartoDB::Logger.debug(
          message: "Error parsing map bounds: #{map.id}, #{map.view_bounds_sw}, #{map.view_bounds_ne}",
          exception: e)
      end

      def layers_for(visualization, options)
        basemap_layer = basemap_layer_for(visualization, options)
        layers_data = []
        layers_data.push(basemap_layer) if basemap_layer

        if visualization.retrieve_named_map?
          presenter_options = {
            user_name: options.fetch(:user_name),
            api_key: options.delete(:user_api_key),
            https_request: options.fetch(:https_request, false),
            viewer_user: @viewer_user,
            owner: visualization.user
          }
          named_maps_presenter = VizJSON3NamedMapPresenter.new(
            visualization, layer_group_for_named_map(visualization, options), presenter_options, configuration)
          layers_data.push(named_maps_presenter.to_poro)
        else
          named_maps_presenter = nil
          layers_data.push(layer_group_for(visualization, options))
        end
        layers_data.push(other_layers_for(visualization, options, named_maps_presenter))

        layers_data += non_basemap_base_layers_for(visualization, options)

        layers_data.compact.flatten
      end

      def layer_group_for_named_map(visualization, options)
        layer_group_poro = layer_group_for(visualization, options)
        # If there is *only* a torque layer, there is no layergroup
        return {} if layer_group_poro.nil?

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

      def layer_group_for(visualization, options)
        VizJSON3LayerGroupPresenter.new(visualization.data_layers, options, configuration).to_poro
      end

      def named_map_layer_group_for(visualization, options)
        VizJSON3LayerGroupPresenter.new(visualization.named_map_layers, options, configuration).to_poro
      end

      def other_layers_for(visualization, options, named_maps_presenter = nil)
        layer_index = visualization.data_layers.size

        visualization.other_layers.map do |layer|
          decoration_data_to_apply = if named_maps_presenter.nil?
                                       {}
                                     else
                                       named_maps_presenter.get_decoration_for_layer(layer.kind, layer_index)
                                     end
          layer_index += 1
          VizJSON3LayerPresenter.new(layer, options, configuration, decoration_data_to_apply).to_vizjson_v3
        end
      end

      # TODO: remove? This method is the equivalent to CartoDB::Visualization::VizJSON, needed by `to_export_poro`.
      # Delete if it's not needed for #6365, which will probably replace the old exporting method.
      def all_layers_for(visualization, options)
        layers_data = []

        basemap_layer = basemap_layer_for(visualization, options)
        layers_data.push(basemap_layer) if basemap_layer

        data_layers = visualization.data_layers.map do |layer|
          VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson_v3
        end
        layers_data.push(data_layers)

        layers_data.push(other_layers_for(visualization))

        layers_data += non_basemap_base_layers_for(visualization, options)

        layers_data.compact.flatten
      end

      # INFO: Assumes layers come always ordered by order (they do)
      def basemap_layer_for(visualization, options)
        layer = visualization.user_layers.first
        VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson_v3 unless layer.nil?
      end

      # INFO: Assumes layers come always ordered by order (they do)
      def non_basemap_base_layers_for(visualization, options)
        base_layers = visualization.user_layers
        unless base_layers.empty?
          # Remove the basemap, which is always first
          base_layers.slice(1, visualization.user_layers.length)
                     .map do |layer|
            VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson_v3
          end
        else
          []
        end
      end

      def configuration
        Cartodb.config
      end

      def user
        @user ||= @visualization.user
      end

      def datasource(options)
        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'
        ds = {
          user_name: @visualization.user.username,
          maps_api_template: ApplicationHelper.maps_api_template(api_templates_type),
          stat_tag: @visualization.id
        }

        ds[:template_name] = CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.id) if @visualization.retrieve_named_map?

        ds
      end

      def user_vizjson_info
        {
          fullname: user.name.present? ? user.name : user.username,
          avatar_url: user.avatar_url
        }
      end

      def widgets
        Carto::Widget.from_visualization_id(@visualization.id).map do |w|
          Carto::Api::WidgetPresenter.new(w).to_poro
        end
      end

      def html_safe(string)
        if string.present?
          renderer = Redcarpet::Render::Safe
          markdown = Redcarpet::Markdown.new(renderer, extensions = {})
          markdown.render string
        end
      end
    end

    class VizJSON3NamedMapPresenter

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

      # Prepares additional data to decorate layers in the LAYER_TYPES_TO_DECORATE list
      # - Parameters set inside as nil will remove the field itself from the layer data
      # @throws NamedMapsPresenterError
      def get_decoration_for_layer(layer_type, layer_index)
        return {} unless LAYER_TYPES_TO_DECORATE.include? layer_type

        {
          'named_map' => {
            'name' =>         @named_map_name,
            'layer_index' =>  layer_index,
            'params' =>       placeholders_data
          },
          'query' => nil # do not expose SQL query on Torque layers with named maps
        }
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
      # @throws NamedMapsPresenterError
      def to_poro
        if @visualization.data_layers.empty?
          nil # When there are no layers don't return named map data
        else
          api_templates_type = @options.fetch(:https_request, false) ? 'private' : 'public'
          privacy_type = @visualization.password_protected? ? 'private' : api_templates_type
          {
            type:     NAMED_MAP_TYPE,
            order:    1,
            options:  {
              type:             NAMED_MAP_TYPE,
              user_name:        @options.fetch(:user_name),
              maps_api_template: ApplicationHelper.maps_api_template(privacy_type),
              sql_api_template: ApplicationHelper.sql_api_template(privacy_type),
              # tiler_* and sql_api_* are kept for backwards compatibility
              tiler_protocol:   @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['protocol'] :
                                  @configuration[:tiler]['public']['protocol'],
              tiler_domain:     @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['domain'] :
                                  @configuration[:tiler]['public']['domain'],
              tiler_port:       @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['port'] :
                                  @configuration[:tiler]['public']['port'],
              filter:           @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
              named_map:        {
                name:     @named_map_name,
                stat_tag: @visualization.id,
                params:   placeholders_data,
                layers:   configure_layers_data
              },
              attribution: @visualization.attributions_from_derived_visualizations.join(', ')
            }
          }
        end
      end

      private

      def placeholders_data
        data = {}
        @layergroup_data.each do |layer|
          data["layer#{layer[:index].to_s}".to_sym] = layer[:visible] ? 1 : 0
        end
        data
      end

      # Extract relevant information from layers
      def configure_layers_data
        # Http/base layers don't appear at viz.json
        layers = @visualization.data_layers
        layers_data = Array.new
        layers.each do |layer|
          layer_vizjson = VizJSON3LayerPresenter.new(layer, @options, @configuration).to_vizjson_v3
          layers_data.push(data_for_carto_layer(layer_vizjson))
        end
        layers_data
      end

      def data_for_carto_layer(layer_vizjson)
        # TODO: this id will probably be removed from named maps
        data = {
            id: layer_vizjson[:id],
            layer_name: layer_vizjson[:options][:layer_name],
            interactivity: layer_vizjson[:options][:interactivity],
            visible: layer_vizjson[:visible]
          }

        if layer_vizjson.include?(:infowindow) && !layer_vizjson[:infowindow].nil? &&
             !layer_vizjson[:infowindow].fetch('fields').nil? && layer_vizjson[:infowindow].fetch('fields').size > 0
          data[:infowindow] = layer_vizjson[:infowindow]
        end

        if layer_vizjson.include?(:tooltip) && !layer_vizjson[:tooltip].nil? &&
             !layer_vizjson[:tooltip].fetch('fields').nil? && layer_vizjson[:tooltip].fetch('fields').size > 0
          data[:tooltip] = layer_vizjson[:tooltip]
        end

        if layer_vizjson.include?(:legend) && !layer_vizjson[:legend].nil? &&
             layer_vizjson[:legend].fetch('type') != 'none'
          data[:legend] = layer_vizjson[:legend]
        end
        data
      end

      # Loads the data of a given named map
      # It completes/overrides data from the children if visualization has a parent_id
      def load_named_map_data
        named_maps = CartoDB::NamedMapsWrapper::NamedMaps.new(
            {
              name:     @options.fetch(:user_name),
              api_key:  @options.fetch(:api_key)
            },
            {
              protocol:   @configuration[:tiler]['internal']['protocol'],
              domain:     @configuration[:tiler]['internal']['domain'],
              port:       @configuration[:tiler]['internal']['port'],
              verifycert: (@configuration[:tiler]['internal']['verifycert'] rescue true)
            }
          )
        @named_map = named_maps.get(CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.id))
        unless @named_map.nil?
          if @visualization.parent_id.nil?
            @named_map_template = @named_map.template.fetch(:template)
          else
            parent_named_map = named_maps.get(CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.parent_id))
            @named_map_template = parent_named_map.template.fetch(:template).merge(@named_map.template.fetch(:template))
          end
        end
        @loaded = true
      end
    end

    class VizJSON3LayerGroupPresenter
      LAYER_GROUP_VERSION = '3.0.0'.freeze
      DEFAULT_TILER_FILTER = 'mapnik'.freeze

      def initialize(layers, options, configuration)
        @layers         = layers
        @options        = options
        @configuration  = configuration
      end

      def to_poro
        return nil if cartodb_layers.empty?

        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'

        {
          type:               'layergroup',
          options:            {
            user_name:          options.fetch(:user_name),
            maps_api_template:  ApplicationHelper.maps_api_template(api_templates_type),
            sql_api_template:   ApplicationHelper.sql_api_template(api_templates_type),
            # tiler_* and sql_api_* are kept for backwards compatibility
            tiler_protocol:     (configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (configuration[:tiler]["public"]["port"] rescue nil),
            sql_api_protocol:   (configuration[:sql_api]["public"]["protocol"] rescue nil),
            sql_api_domain:     (configuration[:sql_api]["public"]["domain"] rescue nil),
            sql_api_endpoint:   (configuration[:sql_api]["public"]["endpoint"] rescue nil),
            sql_api_port:       (configuration[:sql_api]["public"]["port"] rescue nil),
            filter:             @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
            layer_definition:   {
              stat_tag:           options.fetch(:visualization_id),
              version:            LAYER_GROUP_VERSION,
              layers:             cartodb_layers
            },
            attribution: options.fetch(:attributions).join(', ')
          }
        }
      end

      private

      attr_reader :layers, :configuration, :options

      def cartodb_layers
        @cartodb_layers ||= layers.map do |layer|
          VizJSON3LayerPresenter.new(layer, options, configuration).to_vizjson_v3
        end
      end
    end

    class VizJSON3LayerPresenter
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
        query
        tile_style
        named_map
        visible
      ).freeze

      INFOWINDOW_KEYS = %w(fields template_name template alternative_names width maxHeight).freeze

      def initialize(layer, options = {}, configuration = {}, decoration_data = {})
        @layer            = layer
        @options          = options
        @configuration    = configuration
        @decoration_data  = decoration_data
      end

      def to_vizjson_v3
        layer_data = if layer.base?
                       with_kind_as_type(layer.public_values)
                     elsif layer.torque?
                       as_torque
                     else
                       {
                         id:         layer.id,
                         type:       'CartoDB',
                         infowindow: infowindow_data_v3,
                         tooltip:    tooltip_data_v3,
                         legend:     layer.legend,
                         order:      layer.order,
                         visible:    layer.public_values[:options]['visible'],
                         options:    options_data_v3
                       }
                     end

        layer_data
      end

      def to_poro
        # .merge left for backwards compatibility
        poro = layer.public_values

        return poro unless poro[:options]

        if @options[:user] && !poro[:options]['user_name']
          user_name = @options[:user].username
          schema_name = @options[:user].sql_safe_database_schema
        elsif poro[:options]['user_name']
          user_name = poro[:options]['user_name']
          schema_name = poro[:options]['user_name']
        end

        if options[:viewer_user] && user_name && poro[:options]['table_name']
          # if the table_name already have a schema don't add another one
          # this case happens when you share a layer already shared with you
          if user_name != options[:viewer_user].username && !poro[:options]['table_name'].include?('.')
            poro[:options]['table_name'] = if schema_name.include?('-')
                                             "\"#{schema_name}\".#{poro[:options]['table_name']}"
                                           else
                                             "#{schema_name}.#{poro[:options]['table_name']}"
                                           end
          end
        end
        poro
      end

      private

      attr_reader :layer, :options, :configuration

      # Decorates the layer presentation with data if needed. nils on the decoration act as removing the field
      def decorate_with_data(source_hash, decoration_data)
        decoration_data.each do |key, value|
          source_hash[key] = value
          source_hash.delete_if do |k, v|
            v.nil?
          end
        end
        source_hash
      end

      def with_kind_as_type(attributes)
        decorate_with_data(attributes.merge(type: attributes.delete('kind')), @decoration_data)
      end

      def as_torque
        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'
        layer_options = decorate_with_data(
          # Make torque always have a SQL query too (as vizjson v2)
          layer.options.deep_symbolize_keys.merge({ query: wrap(sql_from(layer.options), layer.options) }),
          @decoration_data
        )

        torque = {
          id:         layer.id,
          type:       'torque',
          order:      layer.order,
          legend:     layer.legend,
          options:    {
            stat_tag:           options.fetch(:visualization_id),
            maps_api_template: ApplicationHelper.maps_api_template(api_templates_type),
            sql_api_template: ApplicationHelper.sql_api_template(api_templates_type),
            # tiler_* is kept for backwards compatibility
            tiler_protocol:     (configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (configuration[:tiler]["public"]["port"] rescue nil),
            # sql_api_* is kept for backwards compatibility
            sql_api_protocol:   (configuration[:sql_api]["public"]["protocol"] rescue nil),
            sql_api_domain:     (configuration[:sql_api]["public"]["domain"] rescue nil),
            sql_api_endpoint:   (configuration[:sql_api]["public"]["endpoint"] rescue nil),
            sql_api_port:       (configuration[:sql_api]["public"]["port"] rescue nil),
            layer_name:         name_for(layer),
          }.merge(layer_options.select { |k| TORQUE_ATTRS.include? k })
        }

        layer_options = torque[:options]

        layer_options[:cartocss] = layer_options[:tile_style]
        layer_options.delete(:tile_style)

        layer_options[:cartocss_version] = layer.options['style_version'] if layer
        layer_options.delete(:style_version)

        layer_options[:sql] = if layer_options[:query].present? || layer.nil?
                                layer_options[:query]
                              else
                                layer.options['query']
                              end
        layer_options.delete(:query)

        torque
      end

      def infowindow_data_v3
        whitelisted_infowindow(with_template(layer.infowindow, layer.infowindow_template_path))
      rescue => e
        CartoDB::Logger.error(exception: e, layer_id: @layer.id)
        throw e
      end

      def tooltip_data_v3
        whitelisted_infowindow(with_tooltip_template(layer.tooltip, layer.tooltip_template_path))
      rescue => e
        CartoDB::Logger.error(exception: e, layer_id: @layer.id)
        throw e
      end

      def with_template(infowindow, path)
        # Careful with this logic:
        # - nil means absolutely no infowindow (e.g. a torque)
        # - path = nil or template filled: either pre-filled or custom infowindow, nothing to do here
        # - template and path not nil but template not filled: stay and fill
        return nil if infowindow.nil?
        template = infowindow['template']
        return infowindow if (!template.nil? && !template.empty?) || path.nil?

        infowindow_sym = infowindow.deep_symbolize_keys
        infowindow[:template] = v3_infowindow_template(infowindow_sym[:template_name], infowindow_sym[:template])
        infowindow
      end

      def with_tooltip_template(tooltip, path)
        # Careful with this logic:
        # - nil means absolutely no infowindow (e.g. a torque)
        # - path = nil or template filled: either pre-filled or custom infowindow, nothing to do here
        # - template and path not nil but template not filled: stay and fill
        return nil if tooltip.nil?
        template = tooltip['template']
        return tooltip if (!template.nil? && !template.empty?) || path.nil?

        tooltip_sym = tooltip.deep_symbolize_keys
        tooltip[:template] = v3_tooltip_template(tooltip_sym[:template_name], tooltip_sym[:template])
        tooltip
      end

      def v3_infowindow_template(template_name, fallback_template)
        template_name = Carto::Layer::TEMPLATES_MAP.fetch(template_name, template_name)
        if template_name.present?
          path = Rails.root.join("lib/assets/javascripts/cartodb3/mustache-templates/infowindows/#{template_name}.jst.mustache")
          File.read(path)
        else
          fallback_template
        end
      end

      def v3_tooltip_template(template_name, fallback_template)
        template_name = Carto::Layer::TEMPLATES_MAP.fetch(template_name, template_name)
        if template_name.present?
          path = Rails.root.join("lib/assets/javascripts/cartodb3/mustache-templates/tooltips/#{template_name}.jst.mustache")
          File.read(path)
        else
          fallback_template
        end
      end

      def options_data_v3
        if options[:full]
          decorate_with_data(layer.options, @decoration_data)
        else
          sql = sql_from(layer.options)
          data = {
            sql:                wrap(sql, layer.options),
            layer_name:         name_for(layer),
            cartocss:           css_from(layer.options),
            cartocss_version:   layer.options.fetch('style_version'),
            interactivity:      layer.options.fetch('interactivity')
          }
          data = decorate_with_data(data, @decoration_data)

          viewer = options[:viewer_user]
          if viewer
            unless data['user_name'] == viewer.username
              data['table_name'] = "\"#{data['user_name']}\".#{data['table_name']}"
            end
          end
          data
        end
      end

      def name_for(layer)
        layer_alias = layer.options.fetch('table_name_alias', nil)
        table_name  = layer.options.fetch('table_name')

        return table_name unless layer_alias && !layer_alias.empty?
        layer_alias
      end

      def options_data_v1
        return layer.options if options[:full]
        layer.options.select { |key, _| public_options.include?(key.to_s) }
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
        if options[:viewer_user]
          unless layer_options['user_name'] == options[:viewer_user].username
            name = if layer_options['user_name'] && layer_options['user_name'].include?('-')
                     "\"#{layer_options['user_name']}\""
                   else
                     layer_options['user_name']
                   end

            return "select * from #{name}.#{layer_options['table_name']}"
          end
        end
        "select * from #{layer_options.fetch('table_name')}"
      end

      def public_options
        return configuration if configuration.empty?
        configuration.fetch(:layer_opts).fetch("public_opts")
      end

      def whitelisted_infowindow(infowindow)
        infowindow.nil? ? nil : infowindow.select do |key, _|
          INFOWINDOW_KEYS.include?(key) || INFOWINDOW_KEYS.include?(key.to_s)
        end
      end
    end
  end
end
