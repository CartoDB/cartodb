# encoding: utf-8

module CartoDB
  module NamedMapsWrapper

		class Presenter

			def initialize(visualization, options, configuration)
        @visualization  = visualization
        @options        = options
        @configuration	= configuration

        #TODO: Check options has proper values

        @fetched				= false
      end #initialize

      def to_poro
      	named_map = fetch if !@fetched

        template_data = named_map.template.fetch(:template)

        layers = @visualization.layers(:cartodb)
        layers_data = Array.new

        layers.each { |layer|
          #TODO Remove this dependency by having a .getVizjsonLayers at visualization object
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
        template_data[:placeholders].each { |key, value|
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
              name:     template_data[:name],
              auth:     template_data[:auth][:method],
              params:   params,
              layers:   layers_data
            }
        	}
        }
      end #to_poro

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
            # Here should go the retrieval validator, not the creation one
            #CartoDB::NamedMapsWrapper::TemplateCreationValidator.new()
          )
      	new_named_map = named_maps.get(NamedMap.normalize_name(@visualization.id))
      	@fetched = true
      	new_named_map
      end #fetch

		end #Presenter
	end #NamedMapsWrapper
end #CartoDB