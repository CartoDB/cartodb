# encoding: utf-8

module CartoDB
  module NamedMapsWrapper

		class Presenter

      LAYER_TYPES_TO_DECORATE = [ 'torque' ]

			def initialize(visualization, options, configuration)
        @visualization  = visualization
        @options        = options
        @configuration	= configuration

        @named_map          = nil
        @named_map_template = nil
        @fetched				    = false
      end #initialize

      # Prepares additional data to decorate layers in the LAYER_TYPES_TO_DECORATE list
      def get_decoration_for_layer(layer_type, layer_index)
        return nil if not LAYER_TYPES_TO_DECORATE.include? layer_type

        fetch if !@fetched

        params = {}
        @named_map_template[:placeholders].each { |key, value|
          params[key.to_s] = value[:default]
        }

        { 
          'named_map' =>  {
            'name' =>         @named_map_template[:name],
            'layer_index' =>  layer_index,
            'params' =>       params
          }
        }
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/cartodb.js/blob/privacy-maps/doc/vizjson_format.md
      def to_poro
      	fetch if !@fetched

        layers = @visualization.layers(:cartodb)
        layers_data = Array.new

        layers.each { |layer|
          # TODO Remove this dependency by having a .getVizjsonLayers at visualization object
          layer_vizjson = Layer::Presenter.new(layer, @options, @configuration).to_vizjson_v2
          data = {
            layer_name: layer_vizjson[:options][:layer_name]
          }

          if layer_vizjson[:infowindow].fetch('fields').size > 0
            data[:infowindow] = layer_vizjson[:infowindow]
          end
          if layer_vizjson[:legend].fetch('type') != "none"
            data[:legend] = layer_vizjson[:legend]
          end

          layers_data.push(data)
        }

        params = {}
        @named_map_template[:placeholders].each { |key, value|
          params[key] = value[:default]
        }

        poro = {
        	type: 		'namedmap',
					order: 		1,
	        options: 	{
            type: 							'namedmap',
            user_name:          @options.fetch(:user_name),
            tiler_protocol:     (@configuration[:tiler]['private']['protocol'] rescue nil),
            tiler_domain:       (@configuration[:tiler]['private']['domain'] rescue nil),
            tiler_port:         (@configuration[:tiler]['private']['port'] rescue nil),
            named_map:          {
              name:     @named_map_template[:name],
              auth:     @named_map_template[:auth][:method],
              params:   params,
              layers:   layers_data
            }
        	}
        }
      end #to_poro

      # Loads the data of a given named map
      def fetch
      	named_maps = NamedMaps.new(
            {
              name:     @options.fetch(:user_name),
              api_key:  @options.fetch(:api_key)
            },
            {
              protocol:   (@configuration[:tiler]['private']['protocol'] rescue nil),
              domain: (@configuration[:tiler]['private']['domain'] rescue nil),
              port:     (@configuration[:tiler]['private']['port'] rescue nil)
            },
            # TODO: Here should go the retrieval validator, not the creation one
            #CartoDB::NamedMapsWrapper::TemplateCreationValidator.new()
          )
      	@named_map = named_maps.get(NamedMap.normalize_name(@visualization.id))
        @named_map_template = @named_map.template.fetch(:template) if not @named_map.nil?
      	@fetched = true
      	@named_map
      end #fetch

		end #Presenter
	end #NamedMapsWrapper
end #CartoDB