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
            user_name:          options.fetch(:user_name),
            tiler_protocol:     configuration.fetch(:tiler_protocol, nil),
            tiler_domain:       configuration.fetch(:tiler_domain, nil),
            tiler_port:         configuration.fetch(:tiler_port, nil),
            sql_api_protocol:   configuration.fetch(:sql_api_protocol, nil),
            sql_api_domain:     configuration.fetch(:sql_api_domain, nil),
            sql_api_endpoint:   configuration.fetch(:sql_api_endpoint, nil),
            sql_api_port:       configuration.fetch(:sql_api_port, nil),
            layer_definition:   {
              version:            LAYER_GROUP_VERSION,
              layers:             rendered_layers
            }
          }
        }
      end #to_poro

      private

      attr_reader :layers, :configuration, :options

      def rendered_layers
        layers.map do |layer|
          Layer::Presenter.new(layer, options, configuration).to_vizjson_v2
        end
      end #layer_definition
    end # Presenter
  end # LayerGroup
end # CartoDB

