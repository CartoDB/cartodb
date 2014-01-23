# encoding: utf-8

require 'typhoeus'
require_relative './exceptions'

module CartoDB
	module NamedMapsWrapper

		class MapInstance
			DEFINITION_LAYERGROUPID_FIELD = :layergroupid

			def initialize(map_definition, url)
				raise MapInstanceDataError if url.nil? or url.length == 0
				@url = url

				raise MapInstanceDataError if map_definition.nil? or 
																						!map_definition.is_a?(Hash) or
																						!map_definition.has_key?(DEFINITION_LAYERGROUPID_FIELD)
				@definition = map_definition
			end #initialize

			def tile_url(z, x, y)
					[ 
						@url,
						'tiles',
						'layergroup',
						@definition[DEFINITION_LAYERGROUPID_FIELD],
						z,
						x,
						y.to_s + '.png'
					].map{ |x| x.to_s }.join('/')
			end #tile_url

			def tile(z, x, y)
					response = Typhoeus.get(tile_url(z, x, y), {})

					raise HTTPResponseError, response.code if response.code != 200

					response.response_body
			end #tile

		end #MapInstance

	end #NamedMapsWrapper
end #CartoDB