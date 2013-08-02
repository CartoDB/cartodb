# encoding: utf-8
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
      end #initialize
    
      def to_poro
        {
          version:        "0.1.0",
          title:          table.name,
          description:    table.table_visualization.description,
          url:            options.delete(:url),
          map_provider:   map.provider,
          bounds:         bounds_from(map),
          center:         map.center,
          zoom:           map.zoom,
          updated_at:     map.viz_updated_at,

          layers: [
            CartoDB::Layer::Presenter.new(
              map.base_layers.first, options, configuration
            ).to_vizjson_v1,
            CartoDB::Layer::Presenter.new(
              map.data_layers.first, options, configuration
            ).to_vizjson_v1
          ],

          overlays: [
            {
              type: "zoom",
              template: '<a class="zoom_in">+</a><a class="zoom_out">-</a>'
            },
            {
              type: "loader",
              template: '<div class="loader"></div>'
            }
          ]
        }
      end #to_poro

      private

      attr_reader :map, :table, :options, :configuration

      def bounds_from(map)
        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue => exception
        nil
      end #bounds_from
    end # Presenter
  end # Map
end # CartoDB

