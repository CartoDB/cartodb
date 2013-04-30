# encoding: utf-8
require 'json'
require 'ejs'

module CartoDB
  class Layer
    class Presenter
      CARTO_CSS_VERSION = '2.0.1'

      def initialize(layer, options={}, configuration={})
        @layer          = layer
        @options        = options
        @configuration  = configuration
      end #initialize

      def to_poro
        return with_kind_as_type(layer.public_values) if base?(layer)
        {
          id:         layer.id,
          type:       'CartoDB',
          infowindow: infowindow_data,
          order:      layer.order,
          options:    options_data
        }
      end #to_poro

      alias_method :to_vizjson_v2, :to_poro

      def to_vizjson_v1
        return with_kind_as_type(layer.public_values) if base?(layer)
        representation  = to_poro
        options         = representation.fetch(:options, {})

        options.store(:tile_style,      options.delete(:cartocss))
        representation.store(:options,  options)

        representation
      end #to_vizjson_v1
  
      private

      attr_reader :layer, :options, :configuration

      def base?(layer)
        layer.kind != 'carto'
      end #base?

      def with_kind_as_type(attributes)
        type = attributes.delete(:kind)
        attributes.merge(type: type)
      end #base_to_poro

      def infowindow_data
        layer.infowindow.merge(template: File.read(layer.template_path))
      rescue => exception
      end #infowindow_data

      def options_data
        return layer.options if options[:full]
        sql = sql_from(layer.options)

        layer.options.select { |key, value| 
          public_options.include?(key.to_s) 
        }.merge(
          sql:                sql,
          query:              wrap(sql, layer.options),
          cartocss:           layer.options.fetch('tile_style'),
          cartocss_version:   CARTO_CSS_VERSION,
          interactivity:      layer.options.fetch('interactivity')
        )
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

