# encoding: utf-8

require_relative '../../../../app/models/visualization/vizjson'

module CartoDB
  module NamedMapsWrapper

		class NamedMaps

			def initialize(user_config, tiler_config, vizjson_config = {})
				raise NamedMapsDataError, { 'user' => 'config missing' } if user_config.nil? or user_config.size == 0
				raise NamedMapsDataError, { 'tiler' => 'config missing' } if tiler_config.nil? or tiler_config.size == 0

				@headers = { 'content-type' => 'application/json' }

				@username = user_config[:name]
				@api_key = user_config[:api_key]
				@vizjson_config = vizjson_config

				@host = "#{tiler_config[:protocol]}://#{@username}.#{tiler_config[:domain]}:#{tiler_config[:port]}"
				@url = [ @host, 'tiles', 'template' ].join('/')

				@verbose_mode = false
			end #initialize

			def create(visualization)
				template_data = get_template_data(visualization)
				p template_data if @verbose_mode

				response = Typhoeus.post(@url + '?api_key=' + @api_key, {
					headers: @headers,
					body: ::JSON.dump(template_data),
					verbose: @verbose_mode
					})
				p response.body if @verbose_mode

				if response.code == 200
					body = ::JSON.parse(response.response_body)
					NamedMap.new(body['template_id'], template_data, self)
				else
					nil
				end
			end

			# Retrieve a list of all named maps
			def all
				response = Typhoeus.get(@url + "?api_key=" + @api_key, {
					headers: @headers,
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				raise HTTPResponseError, response.code if response.code != 200

				::JSON.parse(response.response_body)
			end #all

			# Get a specific named map given it's name
			def get(name)
				raise NamedMapsDataError, { 'name' => 'mising' } if name.nil? or name.length == 0

				response = Typhoeus.get( [@url, name ].join('/') + "?api_key=" + @api_key, {
					headers: @headers,
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				if response.code == 200
					template_data = ::JSON.parse(response.response_body)
					if template_data.class == Hash
						# Rails 2.x+
						template_data = template_data.deep_symbolize_keys
					end
					NamedMap.new(name, template_data, self)
				elsif response.code == 404
					# Request ok, template with provided name not found
					nil
				else
					raise HTTPResponseError, response.code
				end
			end #get

			def get_template_data(visualization)
				# 1) general data
				template_data = {
					version: 	NamedMap::NAMED_MAPS_VERSION,
					name: 		NamedMap.normalize_name(visualization.id),
					auth: {
						# TODO: Implement tokens
            method: 	NamedMap::AUTH_TYPE_OPEN
          },
          placeholders: {
          },
          layergroup: {
        		layers: []
        	}
        }

        vizjson = CartoDB::Visualization::VizJSON.new(visualization, { full: false, user_name: @username }, @vizjson_config)
        layers_data = []

        layer_group = vizjson.layer_group_for(visualization)
        if (!layer_group.nil?())
        	layer_group[:options][:layer_definition][:layers].each { |layer|
	          layers_data.push( {
	            type:     layer[:type].downcase,
	            options:  layer[:options]
	          } )
	        }
        end
        
        other_layers = vizjson.other_layers_for( visualization)
        if (!other_layers.nil?())
        	other_layers = other_layers.compact
        	other_layers.each { |layer|

        		sql_query = layer[:options].fetch('query')

        		layers_data.push( {
	            type:     layer[:type].downcase,
	            options:  {
	            	cartocss_version: '2.0.1',
	            	cartocss: 				layer[:options].fetch('tile_style'),
	            	sql: 							sql_query
	            }
	          } )
        	}
        end

        template_data[:layergroup][:layers] = layers_data.compact.flatten

				template_data
			end

			attr_reader	:url, :api_key, :username, :headers, :host

		end #NamedMaps

	end #NamedMapsWrapper
end #CartoDB