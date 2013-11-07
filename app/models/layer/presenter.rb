# encoding: utf-8
require 'json'
require 'ejs'

module CartoDB
  class Layer
    class Presenter
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
      )

      def initialize(layer, options={}, configuration={})
        @layer          = layer
        @options        = options
        @configuration  = configuration
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
            infowindow: infowindow_data,
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
          infowindow: infowindow_data,
          order:      layer.order,
          options:    options_data_v1
        }
      end #to_vizjson_v1
  
      private

      attr_reader :layer, :options, :configuration

      def base?(layer)
        ['tiled', 'background', 'gmapsbase'].include? layer.kind
      end #base?

      def torque?(layer)
        layer.kind == 'torque'
      end #torque?

      def with_kind_as_type(attributes)
        attributes.merge(type: attributes.delete('kind'))
      end #with_kind_as_type

      def as_torque(attributes)
        {
          id:         layer.id,
          type:       'torque',
          order:      layer.order,
          options:    {
            sql_api_protocol:   (configuration[:sql_api]["public"]["sql_api_protocol"] rescue nil),
            sql_api_domain:     (configuration[:sql_api]["public"]["sql_api_domain"] rescue nil),
            sql_api_endpoint:   (configuration[:sql_api]["public"]["sql_api_endpoint"] rescue nil),
            sql_api_port:       (configuration[:sql_api]["public"]["sql_api_port"] rescue nil),
            cdn_url:            configuration.fetch(:cdn_url, nil)
          }.merge(layer.options.select { |k| TORQUE_ATTRS.include? k })
        }
      end #as_torque

      def infowindow_data
        template = layer.infowindow['template']
        return layer.infowindow unless template.nil? || template.empty?
        layer.infowindow.merge(template: File.read(layer.template_path))
      rescue => exception
      end #infowindow_data

      def options_data_v2
        return layer.options if options[:full]
        sql = sql_from(layer.options)
        {
          sql:                wrap(sql, layer.options),
          layer_name:         name_for(layer),
          cartocss:           layer.options.fetch('tile_style'),
          cartocss_version:   layer.options.fetch('style_version'),
          interactivity:      layer.options.fetch('interactivity')
        }
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
    end # Presenter
  end # Layer
end # CartoDB

