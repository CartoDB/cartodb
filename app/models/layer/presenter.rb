# encoding: utf-8
require 'json'
require 'ejs'

module CartoDB
  # Natural naming would be "Layer", but it collides with Layer class
  module LayerModule
    class Presenter
      EMPTY_CSS = '#dummy{}'

      TORQUE_ATTRS = %w(
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
        source
        tile_style
        named_map
        visible
      )

      INFOWINDOW_KEYS = %w(
        fields template_name template alternative_names width maxHeight
      )

      def initialize(layer, options={}, configuration={}, decoration_data={})
        @layer            = layer
        @options          = options
        @configuration    = configuration
        @decoration_data  = decoration_data
      end

      def to_vizjson_v2
        if base?(layer)
          with_kind_as_type(layer.public_values).symbolize_keys
        elsif torque?(layer)
          as_torque
        else
          {
            id:         layer.id,
            type:       'CartoDB',
            infowindow: infowindow_data_v2,
            tooltip:    tooltip_data_v2,
            legend:     layer.legend,
            order:      layer.order,
            visible:    layer.public_values['options']['visible'],
            options:    options_data_v2
          }
        end
      end

      # Old layers_controller directly does layer.to_json, but to be uniform with new controller,
      # always call through the presenter at least in tests
      def to_json(*args)
        layer.to_json(*args)
      end

      def to_vizjson_v1
        return layer.public_values.symbolize_keys if base?(layer)
        {
          id:         layer.id,
          kind:       'CartoDB',
          infowindow: infowindow_data_v1,
          order:      layer.order,
          options:    options_data_v1
        }
      end

      def to_poro
        # .merge left for backwards compatibility
        poro = layer.public_values

        return poro unless poro['options']

        # INFO changed to support new  presenter's way of sending owner
        if @options[:user] && !poro['options']['user_name']
          user_name = @options[:user].username
          schema_name = @options[:user].sql_safe_database_schema
        elsif poro['options']['user_name']
          user_name = poro['options']['user_name']
          schema_name = poro['options']['user_name']
        end

        if options[:viewer_user] && user_name && poro['options']['table_name']
          # if the table_name already have a schema don't add another one
          # this case happens when you share a layer already shared with you
          if user_name != options[:viewer_user].username && !poro['options']['table_name'].include?('.')
            poro['options']['table_name'] = schema_name.include?('-') ?
              "\"#{schema_name}\".#{poro['options']['table_name']}" :
              "#{schema_name}.#{poro['options']['table_name']}"
          end
        end
        poro
      end

      private

      attr_reader :layer, :options, :configuration

      # Decorates the layer presentation with data if needed. nils on the decoration act as removing the field
      def decorate_with_data(source_hash, decoration_data)
        decoration_data.each { |key, value|
          source_hash[key] = value
          source_hash.delete_if { |k, v|
            v.nil?
          }
        }
        source_hash
      end

      def base?(layer)
        ['tiled', 'background', 'gmapsbase', 'wms'].include? layer.kind
      end

      def torque?(layer)
        layer.kind == 'torque'
      end

      def with_kind_as_type(attributes)
        decorate_with_data(attributes.merge(type: attributes.delete('kind')), @decoration_data)
      end

      def as_torque
        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'
        layer_options = decorate_with_data(
            # Make torque always have a SQL query too (as vizjson v2)
            layer.options.merge({ 'query' => wrap(sql_from(layer.options), layer.options) }),
            @decoration_data
          )

        {
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
          }.merge(
            layer_options.select { |k| TORQUE_ATTRS.include? k })
        }
      end

      def infowindow_data_v1
        with_template(layer.infowindow, layer.infowindow_template_path)
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def infowindow_data_v2
        whitelisted_infowindow(with_template(layer.infowindow, layer.infowindow_template_path))
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def tooltip_data_v2
        whitelisted_infowindow(with_template(layer.tooltip, layer.tooltip_template_path))
      rescue => e
        Rollbar.report_exception(e)
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

        infowindow.merge!(template: File.read(path))
        infowindow
      end

      def options_data_v2
        if options[:full]
          decorate_with_data(layer.options, @decoration_data)
        else
          data = {
            layer_name:         name_for(layer),
            cartocss:           css_from(layer.options),
            cartocss_version:   layer.options.fetch('style_version'),
            interactivity:      layer.options.fetch('interactivity')
          }
          source = layer.options['source']
          if source
            data[:source] = source
            data.delete(:sql)
          else
            data[:sql] = wrap(sql_from(layer.options), layer.options)
          end
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
        layer.options.select { |key, value| public_options.include?(key.to_s) }
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
        infowindow.nil? ? nil : infowindow.select { |key, value|
                                                    INFOWINDOW_KEYS.include?(key) || INFOWINDOW_KEYS.include?(key.to_s)
                                                  }
      end
    end
  end
end
