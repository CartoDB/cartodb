# encoding: utf-8
require 'json'

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
        return layer.public_values unless layer.kind == 'carto'

        {
          id:         layer.id,
          type:       'CartoDB',
          infowindow: infowindow_data,
          order:      layer.order,
          options:    options_data
        }
      end #to_poro
  
      private

      attr_reader :layer, :options, :configuration

      def infowindow_data
        layer.infowindow.merge(template: File.read(layer.template_path))
      rescue => exception
      end #infowindow_data

      def options_data
        return layer.options if options[:full]
        {
          sql:                sql_from(layer.options),
          cartocss:           layer.options.fetch('tile_style'),
          cartocss_version:   CARTO_CSS_VERSION,
          interactivity:      layer.options.fetch('interactivity')
        }
      end #options_data

      def sql_from(options)
        query = options.fetch('query', '')
        return query unless query.empty?

        default_query_for(options)
      end #sql_from

      def default_query_for(options)
        "select * from #{options.fetch('table_name')}"
      end #defaut_query_for
    end # Presenter
  end # Layer
end # CartoDB

