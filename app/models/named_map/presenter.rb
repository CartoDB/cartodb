# encoding: utf-8

module CartoDB
  module NamedMapsWrapper
		class Presenter

      NAMED_MAP_TYPE = 'namedmap'

      LAYER_TYPES_TO_DECORATE = [ 'torque' ]

      # @throws NamedMapsPresenterError
			def initialize(visualization, options, configuration)
        @visualization  = visualization
        @options        = options
        @configuration	= configuration

        raise NamedMapsPresenterError.new('Missing internal tiler config') unless @configuration[:tiler]['internal'].present?
        raise NamedMapsPresenterError.new('Missing public tiler config') unless @configuration[:tiler]['private'].present?
        raise NamedMapsPresenterError.new('Missing private tiler config') unless @configuration[:tiler]['public'].present?

        @named_map          = nil
        @named_map_template = nil
        @loaded				    = false
      end #initialize

      # Prepares additional data to decorate layers in the LAYER_TYPES_TO_DECORATE list
      # - Parameters set inside as nil will remove the field itself from the layer data
      # @throws NamedMapsPresenterError
      def get_decoration_for_layer(layer_type, layer_index)
        return {} unless LAYER_TYPES_TO_DECORATE.include? layer_type

        load_named_map_data unless @loaded
        raise NamedMapsPresenterError.new("couldn't load named map template") if @named_map_template.nil?

        params = {}
        @named_map_template[:placeholders].each { |key, value|
          params[key.to_s] = value[:default]
        }

        { 
          'named_map' =>  {
            'name' =>         @named_map_template[:name],
            'layer_index' =>  layer_index,
            'params' =>       params
          },
          'query' => nil  #do not expose SQL query on Torque layers with named maps
        }
      end #get_decoration_for_layer

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
      # @throws NamedMapsPresenterError
      def to_poro
      	load_named_map_data unless @loaded
        raise NamedMapsPresenterError.new("couldn't load named map template") if @named_map_template.nil?

        params = {}
        @named_map_template[:placeholders].each { |key, value|
          params[key] = value[:default]
        }

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
              named_map:        {
                name:     @named_map_template[:name],
                params:   params,
                layers:   configure_layers_data
              }
            }
          }
        end
      end #to_poro

      private

      # Extract relevant information from layers
      def configure_layers_data
        layers = @visualization.layers(:cartodb)
        layers_data = Array.new

        layers.each { |layer|
          layer_vizjson = layer.get_presenter(@options, @configuration).to_vizjson_v2
          data = {
            layer_name: layer_vizjson[:options][:layer_name],
            interactivity: layer_vizjson[:options][:interactivity]
          }

          if layer_vizjson.include?(:infowindow) && !layer_vizjson[:infowindow].nil? &&
               layer_vizjson[:infowindow].fetch('fields').size > 0
            data[:infowindow] = layer_vizjson[:infowindow]
          end

          if layer_vizjson.include?(:legend) && !layer_vizjson[:legend].nil? &&
               layer_vizjson[:legend].fetch('type') != 'none'
            data[:legend] = layer_vizjson[:legend]
          end

          layers_data.push(data)
        }

        layers_data
      end

      # Loads the data of a given named map
      def load_named_map_data
      	named_maps = NamedMaps.new(
            {
              name:     @options.fetch(:user_name),
              api_key:  @options.fetch(:api_key)
            },
            {
              protocol:   @configuration[:tiler]['internal']['protocol'],
              domain:     @configuration[:tiler]['internal']['domain'],
              port:       @configuration[:tiler]['internal']['port'],
              verifycert: (@configuration[:tiler]['internal']['verifycert'] rescue true)
            }
          )
      	@named_map = named_maps.get(NamedMap.normalize_name(@visualization.id))
        @named_map_template = @named_map.template.fetch(:template) unless @named_map.nil?
      	@loaded = true
      end #fetch

		end #Presenter
	end #NamedMapsWrapper
end #CartoDB
