# encoding: utf-8
require 'json'
require 'ejs'

module CartoDB
  class Layer
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
        tile_style
        named_map
      )

      INFOWINDOW_KEYS = %w(
        fields template_name template alternative_names
      )

      def initialize(layer, options={}, configuration={}, decoration_data={})
        @layer            = layer
        @options          = options
        @configuration    = configuration
        @decoration_data  = decoration_data
      end #initialize

      def to_vizjson_v2
        if base?(layer)
          with_kind_as_type(layer.public_values) 
        elsif torque?(layer)
          as_torque(layer)
        else
          {
            id:         layer.id,
            type:       'CartoDB',
            infowindow: infowindow_data_v2,
            tooltip:    tooltip_data_v2,
            legend:     layer.legend,
            order:      layer.order,
            options:    options_data_v2
          }
        end
      end #to_vizjson_v2

      def to_vizjson_v1
        return layer.public_values if base?(layer)
        {
          id:         layer.id,
          kind:       'CartoDB',
          infowindow: infowindow_data_v1,
          order:      layer.order,
          options:    options_data_v1
        }
      end #to_vizjson_v1
  
      private

      attr_reader :layer, :options, :configuration

      # Decorates the layer presentation with data if needed. nils on the decoration act as removing the field
      def decorate_with_data(source_hash, decoration_data=nil)
        if (not decoration_data.nil?)
          decoration_data.each { |key, value| 
            source_hash[key] = value
            source_hash.delete_if { |k, v| 
              v.nil? 
            }
          }
        end
        source_hash
      end #decorate_with_data

      def base?(layer)
        ['tiled', 'background', 'gmapsbase', 'wms'].include? layer.kind
      end #base?

      def torque?(layer)
        layer.kind == 'torque'
      end #torque?

      def with_kind_as_type(attributes)
        attributes = decorate_with_data(attributes.merge(type: attributes.delete('kind')), @decoration_data)
      end #with_kind_as_type

      def as_torque(attributes)
        # Make torque always have a SQL query too (as vizjson v2)
        layer.options['query'] = sql_from(layer.options)

        layer_options = decorate_with_data(layer.options, @decoration_data)

        data = {
          id:         layer.id,
          type:       'torque',
          order:      layer.order,
          legend:     layer.legend,
          options:    {
            stat_tag:           options.fetch(:visualization_id),
            tiler_protocol:     (configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (configuration[:tiler]["public"]["port"] rescue nil),
            sql_api_protocol:   (configuration[:sql_api]["public"]["protocol"] rescue nil),
            sql_api_domain:     (configuration[:sql_api]["public"]["domain"] rescue nil),
            sql_api_endpoint:   (configuration[:sql_api]["public"]["endpoint"] rescue nil),
            sql_api_port:       (configuration[:sql_api]["public"]["port"] rescue nil),
            cdn_url:            configuration.fetch(:cdn_url, nil),
            layer_name:         name_for(layer)
          }.merge(
            layer_options.select { |k| TORQUE_ATTRS.include? k })
        }
      end #as_torque

      def infowindow_data_v1
        with_template(layer.infowindow, layer.infowindow_template_path)
      rescue => exception
      end

      def infowindow_data_v2
        whitelisted_infowindow(with_template(layer.infowindow, layer.infowindow_template_path))
      rescue => exception
      end

      def tooltip_data_v2 
        whitelisted_infowindow(with_template(layer.tooltip, layer.tooltip_template_path))
      rescue => exception
      puts exception
      end

      def with_template(infowindow, path)
        template = infowindow['template']
        return infowindow unless template.nil? || template.empty?

        infowindow.merge!(template: File.read(path))
        infowindow
      end

      def options_data_v2
        if options[:full]
          full_data = decorate_with_data(layer.options, @decoration_data)
          full_data.options
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
        end
      end #options_data_v2

      alias_method :to_poro, :to_vizjson_v1

      def name_for(layer)
        layer_alias = layer.options.fetch('table_name_alias', nil)
        table_name  = layer.options.fetch('table_name') 

        return table_name unless layer_alias && !layer_alias.empty?
        layer_alias
      end

      def options_data_v1
        return layer.options if options[:full]
        sql = sql_from(layer.options)
        layer.options.select { |key, value| public_options.include?(key.to_s) }
      end #options_data

      def sql_from(options)
        query = options.fetch('query', '')
        return default_query_for(options) if query.nil? || query.empty?
        query
      end #sql_from

      def css_from(options)
        style = options.include?('tile_style') ? options['tile_style'] : nil
        (style.nil? || style.strip.empty?) ? EMPTY_CSS : options.fetch('tile_style')
      end #css_from

      def wrap(query, options)
        wrapper = options.fetch('query_wrapper', nil)
        return query if wrapper.nil? || wrapper.empty?
        EJS.evaluate(wrapper, sql: query)
      end #wrap

      def default_query_for(options)
        "select * from #{options.fetch('table_name')}"
      end #defaut_query_for

      def public_options
        return configuration if configuration.empty?
        configuration.fetch(:layer_opts).fetch("public_opts")
      end #public_options

      def whitelisted_infowindow(infowindow)
        infowindow.select { |key, value| 
          INFOWINDOW_KEYS.include?(key) ||
          INFOWINDOW_KEYS.include?(key.to_s)
        }
      end
    end # Presenter
  end # Layer
end # CartoDB

