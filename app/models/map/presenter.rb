require 'json'
require_relative '../../models/layer/presenter'

module CartoDB
  module Map
    class Presenter
      def initialize(map, options={}, configuration={}, logger=nil)
        @map            = map
        @table          = map.tables.first
        @options        = { full: true }.merge(options)
        @configuration  = configuration
        logger.info(map.inspect) if logger
      end

      def to_poro

        {
          version:        "0.1.0",
          title:          table.name,
          description:    table.table_visualization.description,
          url:            options.delete(:url),
          map_provider:   map.provider,
          scrollwheel:    map.scrollwheel,
          legends:        map.legends,
          bounds:         bounds_from(map),
          center:         map.center,
          zoom:           map.zoom,
          updated_at:     map.viz_updated_at,

          layers: [
            CartoDB::LayerModule::Presenter.new(map.base_layers.first, options, configuration).to_vizjson_v1,
            CartoDB::LayerModule::Presenter.new(map.data_layers.first, options, configuration).to_vizjson_v1
          ]
        }
      end

      private

      attr_reader :map, :table, :options, :configuration, :scrollwheel, :legends

      def bounds_from(map)
        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue StandardError => exception
        CartoDB::notify_exception(exception, user: current_user)
        nil
      end
    end
  end
end
