# encoding: utf-8

module CartoDB
  module NamedMapsWrapper
    class Presenter

      NAMED_MAP_TYPE = 'namedmap'

      LAYER_TYPES_TO_DECORATE = [ 'torque' ]

      # @throws NamedMapsPresenterError
      def initialize(visualization, layergroup, options, configuration)
        @visualization    = visualization
        @options          = options
        @configuration    = configuration
        @layergroup_data  = layergroup
        @named_map_name   = NamedMap.normalize_name(@visualization.id)
      end

      # Prepares additional data to decorate layers in the LAYER_TYPES_TO_DECORATE list
      # - Parameters set inside as nil will remove the field itself from the layer data
      # @throws NamedMapsPresenterError
      def get_decoration_for_layer(layer_type, layer_index)
        return {} unless LAYER_TYPES_TO_DECORATE.include? layer_type

        {
          'named_map' =>  {
            'name' =>         @named_map_name,
            'layer_index' =>  layer_index,
            'params' =>       placeholders_data
          },
          'query' => nil  #do not expose SQL query on Torque layers with named maps
        }
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
      # @throws NamedMapsPresenterError
      def to_poro
        if @visualization.layers(:cartodb).size == 0
          # When there are no layers don't return named map data
          nil
        else
          {
            type:     NAMED_MAP_TYPE,
            order:    1,
            options:  {
              type:             NAMED_MAP_TYPE,
              user_name:        @options.fetch(:user_name),
              tiler_protocol:   @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['protocol'] : 
                                  @configuration[:tiler]['public']['protocol'],
              tiler_domain:     @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['domain'] :
                                  @configuration[:tiler]['public']['domain'],
              tiler_port:       @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['port'] :
                                  @configuration[:tiler]['public']['port'],
              cdn_url:          @configuration.fetch(:cdn_url, nil),
              dynamic_cdn:        @options.fetch(:dynamic_cdn_enabled),
              named_map:        {
                name:     @named_map_name,
                stat_tag: @visualization.id,
                params:   placeholders_data,
                layers:   configure_layers_data
              }
            }
          }
        end
      end

      private

      def placeholders_data
        data = {}
        @layergroup_data.each { |layer|
          data["layer#{layer[:index].to_s}".to_sym] = layer[:visible] ? 1: 0
        }
        data
      end

      # Extract relevant information from layers
      def configure_layers_data
        layers = @visualization.layers(:cartodb)
        layers_data = Array.new

        layers.each { |layer|
          layer_vizjson = layer.get_presenter(@options, @configuration).to_vizjson_v2
          data = {
            layer_name: layer_vizjson[:options][:layer_name],
            interactivity: layer_vizjson[:options][:interactivity],
            visible: layer_vizjson[:visible]
          }

          if layer_vizjson.include?(:infowindow) && !layer_vizjson[:infowindow].nil? &&
               layer_vizjson[:infowindow].fetch('fields').size > 0
            data[:infowindow] = layer_vizjson[:infowindow]
          end

          if layer_vizjson.include?(:tooltip) && !layer_vizjson[:tooltip].nil? &&
               layer_vizjson[:tooltip].fetch('fields').size > 0
            data[:tooltip] = layer_vizjson[:tooltip]
          end

          if layer_vizjson.include?(:legend) && !layer_vizjson[:legend].nil? &&
               layer_vizjson[:legend].fetch('type') != 'none'
            data[:legend] = layer_vizjson[:legend]
          end

          layers_data.push(data)
        }

        layers_data
      end

    end
  end
end
