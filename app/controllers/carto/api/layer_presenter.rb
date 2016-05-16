# encoding: UTF-8

module Carto
  module Api
    class LayerPresenter

      PUBLIC_VALUES = %W{ options kind infowindow tooltip id order }

      # CSS is not stored by default, only when sent by frontend,
      # so this is returned whenever a layer that needs CSS but has none is requestesd
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

        @viewer_user = options.fetch(:viewer_user, nil)
        @owner_user  = options.fetch(:user, nil)
      end

      def to_poro
        base_poro(@layer)
      end

      def to_json
        public_values(@layer).to_json
      end

      def to_vizjson_v2
        if base?(@layer)
          with_kind_as_type(base_poro(@layer)).symbolize_keys
        elsif torque?(@layer)
          as_torque
        else
          {
            id:         @layer.id,
            type:       'CartoDB',
            infowindow: infowindow_data_v2,
            tooltip:    tooltip_data_v2,
            legend:     @layer.legend,
            order:      @layer.order,
            visible:    public_values(@layer).symbolize_keys[:options]['visible'],
            options:    options_data_v2
          }
        end
      end

      def to_vizjson_v1
        return base_poro(@layer).symbolize_keys if base?(@layer)
        {
          id:         @layer.id,
          kind:       'CartoDB',
          infowindow: infowindow_data_v1,
          order:      @layer.order,
          options:    options_data_v1
        }
      end

      private

      def viewer_is_owner?
        return (@owner_user.id == @viewer_user.id) if (@owner_user && @viewer_user)

        # This can be removed if 'user_name' support is dropped
        layer_opts = @layer.options.nil? ? Hash.new : @layer.options
        if @viewer_user && layer_opts['user_name'] && layer_opts['table_name']
          @viewer_user.username == layer_opts['user_name']
        else
          true
        end
      end

      # INFO: Assumes table_name needs to always be qualified, don't call if doesn't
      def qualify_table_name
        layer_opts = @layer.options.nil? ? Hash.new : @layer.options

        # if the table_name already have a schema don't add another one.
        # This case happens when you share a layer already shared with you
        return layer_opts['table_name'] if layer_opts['table_name'].include?('.')

        if @owner_user && @viewer_user
          @layer.qualified_table_name(@owner_user)
        else
          # TODO: Legacy support: Remove 'user_name' and use always :viewer_user and :user
          user_name = layer_opts['user_name']
          if user_name.include?('-')
            "\"#{layer_opts['user_name']}\".#{layer_opts['table_name']}"
          else
            "#{layer_opts['user_name']}.#{layer_opts['table_name']}"
          end
        end
      end

      def base_poro(layer)
        # .merge left for backwards compatibility
        public_values(layer).merge('options' => layer_options)
      end

      def public_values(layer)
        Hash[ PUBLIC_VALUES.map { |attribute| [attribute, layer.send(attribute)] } ]
      end

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

      def layer_options
        layer_opts = @layer.options.nil? ? Hash.new : @layer.options
        if layer_opts['table_name'] && !viewer_is_owner?
          layer_opts['table_name'] = qualify_table_name
        end

        layer_opts['style_properties'] = autogenerate_style_properties unless layer_opts['style_properties'].present?

        layer_opts
      end

      def options_data_v1
        return @layer.options if @options[:full]
        @layer.options.select { |key, value| public_options.include?(key.to_s) }
      end

      def options_data_v2
        if @options[:full]
          decorate_with_data(@layer.options, @decoration_data)
        else
          sql = sql_from(@layer.options)
          data = {
            sql:                wrap(sql, @layer.options),
            layer_name:         name_for(@layer),
            cartocss:           css_from(@layer.options),
            cartocss_version:   @layer.options.fetch('style_version'),  # Mandatory
            interactivity:      @layer.options.fetch('interactivity')   # Mandatory
          }
          data = decorate_with_data(data, @decoration_data)

          if @viewer_user
            if @layer.options['table_name'] && !viewer_is_owner?
              data['table_name'] = qualify_table_name
            end
          end
          data
        end
      end

      def with_kind_as_type(attributes)
        decorate_with_data(attributes.merge(type: attributes.delete('kind')), @decoration_data)
      end

      def as_torque
        api_templates_type = @options.fetch(:https_request, false) ? 'private' : 'public'
        layer_options = decorate_with_data(
            # Make torque always have a SQL query too (as vizjson v2)
            @layer.options.merge({ 'query' => wrap(sql_from(@layer.options), @layer.options) }),
            @decoration_data
          )

        {
          id:         @layer.id,
          type:       'torque',
          order:      @layer.order,
          legend:     @layer.legend,
          options:    {
            stat_tag:           @options.fetch(:visualization_id),
            maps_api_template:  ApplicationHelper.maps_api_template(api_templates_type),
            sql_api_template:   ApplicationHelper.sql_api_template(api_templates_type),
            # tiler_* is kept for backwards compatibility
            tiler_protocol:     (@configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (@configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (@configuration[:tiler]["public"]["port"] rescue nil),
            # sql_api_* is kept for backwards compatibility
            sql_api_protocol:   (@configuration[:sql_api]["public"]["protocol"] rescue nil),
            sql_api_domain:     (@configuration[:sql_api]["public"]["domain"] rescue nil),
            sql_api_endpoint:   (@configuration[:sql_api]["public"]["endpoint"] rescue nil),
            sql_api_port:       (@configuration[:sql_api]["public"]["port"] rescue nil),
            layer_name:         name_for(@layer),
          }.merge(
            layer_options.select { |k| TORQUE_ATTRS.include? k })
        }
      end

      def infowindow_data_v1
        with_template(@layer.infowindow, @layer.infowindow_template_path)
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def infowindow_data_v2
        whitelisted_infowindow(with_template(@layer.infowindow, @layer.infowindow_template_path))
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def tooltip_data_v2
        whitelisted_infowindow(with_template(@layer.tooltip, @layer.tooltip_template_path))
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def name_for(layer)
        layer_alias = layer.options.fetch('table_name_alias', nil)
        table_name  = layer.options['table_name']

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
        (style.nil? || style.strip.empty?) ? EMPTY_CSS : style
      end

      def wrap(query, options)
        wrapper = options.fetch('query_wrapper', nil)
        return query if wrapper.nil? || wrapper.empty?
        EJS.evaluate(wrapper, sql: query)
      end

      def default_query_for(layer_options)
        if viewer_is_owner?
          "select * from #{layer_options['table_name']}"
        else
          "select * from #{qualify_table_name}"
        end
      end

      def public_options
        return @configuration if @configuration.empty?
        @configuration.fetch(:layer_opts).fetch('public_opts')
      end

      def whitelisted_infowindow(infowindow)
        infowindow.nil? ? nil : infowindow.select { |key, value|
                                                    INFOWINDOW_KEYS.include?(key) || INFOWINDOW_KEYS.include?(key.to_s)
                                                  }
      end

      def autogenerate_style_properties
        wizard_properties = @layer.options['wizard_properties']
        return nil unless wizard_properties.present?

        {
          'autogenerated' => true
        }
      end

    end
  end
end
