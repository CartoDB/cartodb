# encoding: utf-8

require_relative './named_maps'
require_relative './named_map'

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

        template_data = named_map.template.fetch('template')

        layers = Array.new

        template_data['layergroup']['layers'].each { |layer|
          layers.push({
            layer_name: layer['options']['layer_name'],
            legend: '',
            infowindow: ''
            # TODO: add legend
            # TODO: add infowindow
          })
        }

        poro = {
        	type: 		'namedmap',
					order: 		1,	# TODO: Remove this?
	        options: 	{
            type: 							'namedmap',
            user_name:          @options.fetch(:user_name),
            tiler_protocol:     (@configuration[:tiler]['private']['protocol'] rescue nil),
            tiler_domain:       (@configuration[:tiler]['private']['domain'] rescue nil),
            tiler_port:         (@configuration[:tiler]['private']['port'] rescue nil),
            named_map:          {
              name:     template_data['name'],
              auth:     template_data['auth']['method'],
              params:   {},
              layers:   layers
            }
        	}
        }

        poro
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
            }
          )
      	new_named_map = named_maps.get(NamedMap.normalize_name(@visualization.id))
      	@fetched = true
      	new_named_map
      end #fetch

		end #Presenter
	end #NamedMapsWrapper
end #CartoDB