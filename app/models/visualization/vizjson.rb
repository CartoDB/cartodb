# encoding: utf-8
require 'json'
require 'ostruct'
require_relative '../overlay/presenter'
require_relative '../layer/presenter'
require_relative '../layer_group/presenter'
require_relative '../named_map/presenter'
require_relative '../../../services/named-maps-api-wrapper/lib/named_maps_wrapper'


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

      # Return a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
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

      # Return the layer group data for a named map
      def layer_group_for_named_map
        layer_group_poro = layer_group_for(visualization)

        # If there is *only* a torque layer, there is no layergroup
        return nil if layer_group_poro.nil?

        layers_data = Array.new
        layer_group_poro[:options][:layer_definition][:layers].each { |layer|
          layers_data.push( {
            type:     layer[:type],
            options:  layer[:options]
          } )
        }

        {
          version:  layer_group_poro[:options][:layer_definition][:version],
          layers:   layers_data
        }
      end #layer_group_for_named_map

      def layer_group_for(visualization)
        LayerGroup::Presenter.new(
          visualization.layers(:cartodb), options, configuration
        ).to_poro
      end #layer_group_for

      def other_layers_for(visualization, named_maps_presenter = nil)
        layer_index = visualization.layers(:cartodb).size

        visualization.layers(:others).map do |layer|
          if named_maps_presenter.nil?
            decoration_data_to_apply = {}
          else
            decoration_data_to_apply = named_maps_presenter.get_decoration_for_layer(layer.kind, layer_index)
          end
          layer_index += 1
          Layer::Presenter.new(layer, options, configuration, decoration_data_to_apply).to_vizjson_v2
        end
      end #other_layers_for

      private

      attr_reader :visualization, :map, :options, :configuration

      def bounds_from(map)
        ::JSON.parse("[#{map.view_bounds_sw}, #{map.view_bounds_ne}]")
      rescue => exception
      end #bounds_from

      def layers_for(visualization)
        layers_data = [
          base_layers_for(visualization)
        ]

        if visualization.retrieve_named_map?
          presenter_options = {
            user_name: options.fetch(:user_name),
            api_key: options.delete(:user_api_key)
          }
          named_maps_presenter = CartoDB::NamedMapsWrapper::Presenter.new(visualization, presenter_options, configuration)
          layers_data.push( named_maps_presenter.to_poro() )
        else
          named_maps_presenter = nil
          layers_data.push( layer_group_for(visualization) )
        end
        layers_data.push( other_layers_for( visualization, named_maps_presenter ) )
        layers_data.compact.flatten
      end #layers_for

      def base_layers_for(visualization)
        visualization.layers(:base).map do |layer|
          Layer::Presenter.new(layer, options, configuration).to_vizjson_v2
        end
      end #base_layers_for

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

