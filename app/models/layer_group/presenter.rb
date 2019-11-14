require_relative '../layer/presenter'

module CartoDB
  module LayerGroup
    class Presenter
      LAYER_GROUP_VERSION = '1.0.1'
      DEFAULT_TILER_FILTER = 'mapnik'

      def initialize(layers, options, configuration)
        @layers         = layers
        @options        = options
        @configuration  = configuration
      end #initialize

      def to_poro
        return nil if cartodb_layers.empty?

        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'

        {
          type:               'layergroup',
          options:            {
            user_name:          options.fetch(:user_name),
            maps_api_template:  ApplicationHelper.maps_api_template(api_templates_type),
            sql_api_template:   ApplicationHelper.sql_api_template(api_templates_type),
            # tiler_* and sql_api_* are kept for backwards compatibility
            tiler_protocol:     (configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (configuration[:tiler]["public"]["port"] rescue nil),
            sql_api_protocol:   (configuration[:sql_api]["public"]["protocol"] rescue nil),
            sql_api_domain:     (configuration[:sql_api]["public"]["domain"] rescue nil),
            sql_api_endpoint:   (configuration[:sql_api]["public"]["endpoint"] rescue nil),
            sql_api_port:       (configuration[:sql_api]["public"]["port"] rescue nil),
            filter:             @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
            layer_definition:   {
              stat_tag:           options.fetch(:visualization_id),
              version:            LAYER_GROUP_VERSION,
              layers:             cartodb_layers
            },
            attribution: options.fetch(:attributions).join(', ')
          }
        }
      end

      private

      attr_reader :layers, :configuration, :options

      def cartodb_layers
        @cartodb_layers ||= layers.map do |layer|
          CartoDB::LayerModule::Presenter.new(layer, options, configuration).to_vizjson_v2
        end
      end
    end
  end
end
