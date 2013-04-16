# encoding: utf-8
require 'json'

module CartoDB
  class Layer
    class Presenter
      PUBLIC_ATTRIBUTES = %W{ options kind infowindow id order }
      CARTO_CSS_VERSION = '2.0.1'

      def initialize(layer, options={}, configuration={})
        @layer          = layer
        @options        = options
        @configuration  = configuration
      end #initialize

      def to_poro
        return layer.public_values unless layer.kind == 'carto'
        layer_to_poro
      end #to_poro
  
      private

      attr_reader :layer, :options, :configuration

      def layer_to_poro
        Hash[PUBLIC_ATTRIBUTES.map { |key| data_for(key) }]
      end #layer_to_poro

      def data_for(key)
        return [:options, options_data] if key == 'options' && !options[:full]
        return [:infowindow, infowindow_data] if key == 'infowindow'
        return [:type, layer.kind]            if key == 'kind'
        return [key, layer.send(key)]
      end #data_for

      def options_data
        options = JSON.parse(layer.options)
        {
          sql:                sql_from(options),
          cartocss:           options.fetch('tile_style'),
          cartocss_version:   CARTOCSS_VERSION,
          interactivity:      options.fetch('interactivity')
        }
      end #options_data

      def infowindow_data
        layer.infowindow.merge(template: File.read(layer.template_path))
      rescue => exception
      end #infowindow_data

      def sql_from(options)
        options.fetch('query', default_query_for(options))
      end #sql_from

      def default_query_for(options)
        "select * from #{options.fetch('table_name')}"
      end #defaut_query_for
    end # Presenter
  end # Layer
end # CartoDB

