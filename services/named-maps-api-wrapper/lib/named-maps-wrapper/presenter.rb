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

        poro = {
        	type: 		'named-map',
					order: 		1,	# TODO: Remove this?
	        options: 	{
            type: 							"named-map",
            user_name:          @options.fetch(:user_name),
            tiler_protocol:     (@configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (@configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (@configuration[:tiler]["public"]["port"] rescue nil),
            require_password: 	false,	# TODO change when supporting auth
            named_map: 					named_map.template.fetch('template')
        	}
        }

        poro
      end #to_poro

      def fetch
      	named_maps = NamedMaps.new(@options.fetch(:url), @options.fetch(:api_key))
      	new_named_map = named_maps.get(NamedMap.normalize_name(@visualization.id))
      	@fetched = true
      	new_named_map
      end #fetch

		end #Presenter
	end #NamedMapsWrapper
end #CartoDB