# encoding: utf-8
require 'json'

module CartoDB
  class Layer
    class Presenter
      PUBLIC_ATTRIBUTES = %W{ options kind infowindow id order }

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
        return [:options, options_data] if key == "options" && !options[:full]
        return [:infowindow, infowindow_data] if key == "infowindow"
        return [key, layer.send(key)]
      end #data_for

      def options_data
        layer.options.select { |key, value| public_options.include?(key.to_s) }
      end #options_data

      def infowindow_data
        layer.infowindow.merge(template: File.read(layer.template_path))
      rescue => exception
      end #infowindow_data

      def public_options
        configuration.fetch(:layer_opts).fetch("public_opts")
      end #public_options
    end # Presenter
  end # Layer
end # CartoDB

