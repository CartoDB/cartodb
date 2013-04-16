# encoding: utf-8
require_relative '../layer/presenter'

module CartoDB
  module LayerGroup
    class Presenter
      LAYER_GROUP_VERSION = '1.0.1'

      def initialize(layers, options, configuration)
        @layers         = layers
        @options        = options
        @configuration  = configuration
      end #initialize

      def to_poro
        { 
          type:               'layergroup',
          options:            {
            version:            LAYER_GROUP_VERSION,
            tile_protocol:      configuration.fetch(:tile_protocol, nil),
            tile_host:          configuration.fetch(:tile_host, nil),
            tile_port:          configuration.fetch(:tile_port, nil),
            sql_api_protocol:   configuration.fetch(:sql_api_protocol, nil),
            sql_api_domain:     configuration.fetch(:sql_api_domain, nil),
            sql_api_endpoint:   configuration.fetch(:sql_api_endpoint, nil),
            sql_api_port:       configuration.fetch(:sql_api_port, nil),
            layer_definition:   layer_definition
          }
        }
      end #to_poro

      private

      attr_reader :layers, :configuration, :options

      def layer_definition
        layers.map do |layer|
          Layer::Presenter.new(layer, options, configuration).to_poro
        end
      end #layer_definition
    end # Presenter
  end # LayerGroup
end # CartoDB

