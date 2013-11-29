# encoding: utf-8
require 'json'
require 'ostruct'
require_relative '../overlay/presenter'
require_relative '../layer/presenter'
require_relative '../layer_group/presenter'

module CartoDB
  module Visualization
    class VizJSON
      VIZJSON_VERSION     = '0.1.0'

      def initialize(visualization, options={}, configuration={}, logger=nil)
        @visualization    = visualization
        @map              = visualization.map
        @options          = default_options.merge(options)
        @configuration    = configuration
        logger.info(map.inspect) if logger
      end #initialize
    
      def to_poro
        {
          id:             visualization.id,
          version:        VIZJSON_VERSION,
          title:          visualization.name,
          description:    visualization.description,
          url:            options.delete(:url),
          map_provider:   map.provider,
          bounds:         bounds_from(map),
          center:         map.center,
          zoom:           map.zoom,
          updated_at:     map.viz_updated_at,
          layers:         layers_for(visualization),
          overlays:       overlays_for(visualization)
        }
      end #to_poro

      private

      attr_reader :visualization, :map, :options, :configuration

      def bounds_from(map)
        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue => exception
      end #bounds_from

      def layers_for(visualization)
        [
          base_layers_for(visualization), 
          layer_group_for(visualization),
          other_layers_for(visualization)
        ].compact.flatten
      end #layers_for

      def base_layers_for(visualization)
        visualization.layers(:base).map do |layer|
          Layer::Presenter.new(layer, options, configuration).to_vizjson_v2
        end
      end #base_layers_for

      def layer_group_for(visualization)
        LayerGroup::Presenter.new(
          visualization.layers(:cartodb), options, configuration
        ).to_poro
      end #layer_group_for

      def other_layers_for(visualization)
        visualization.layers(:others).map do |layer|
          Layer::Presenter.new(layer, options, configuration).to_vizjson_v2
        end
      end #other_layers_for

      def overlays_for(map)
        ordered_overlays_for(visualization).map do |overlay| 
          Overlay::Presenter.new(overlay).to_poro
        end
      end #overlays_for

      def ordered_overlays_for(visualization)
        hardcoded_overlays + visualization.overlays.to_a
      end #ordered_overlays_for

      def hardcoded_overlays
        [zoom_overlay, loader_overlay]
      end #hardcoded_overlays

      def zoom_overlay
        OpenStruct.new(
          type: "zoom",
          template: '<a class="zoom_in">+</a><a class="zoom_out">-</a>'
        )
      end #zoom_overlay

      def loader_overlay
        OpenStruct.new(
          type: "loader",
          template: '<div class="loader"></div>'
        )
      end #loader_overlay

      def default_options
        { full: true, visualization_id: visualization.id }
      end #default_options
    end # VizJSON
  end # Visualization
end # CartoDB

