# encoding: utf-8

require_relative '../../../../app/models/visualization/vizjson'

module CartoDB
  module NamedMapsWrapper

		class NamedMap
			NAMED_MAPS_VERSION  = '0.0.1'
			NAME_PREFIX = 'tpl_'
			AUTH_TYPE_OPEN = 'open'
			AUTH_TYPE_SIGNED = 'token'

			# Load with existing data
			def initialize( name, template_data, parent )
				raise NamedMapDataError, 'Name empty' if name.nil? or name.length == 0
				@name = name

				raise NamedMapDataError, 'Parent instance of named maps invalid' unless parent.respond_to?( :url ) 			\
					 and parent.respond_to?( :api_key )		\
					 and parent.respond_to?( :headers )
				@parent = parent

				@template = template_data
			end #initialize

			# Create a new named map
			def self.create_new( visualization, parent )
				template_data = NamedMap.get_template_data( visualization, parent )

				response = Typhoeus.post( parent.url + '?api_key=' + parent.api_key, {
					headers: parent.headers,
					body: ::JSON.dump( template_data )
					#,verbose: true
					} )

				if response.code == 200
					body = ::JSON.parse(response.response_body)
					self.new( body['template_id'], template_data, parent )
				else
					nil
				end
			end #self.create_new

			# Update a named map's template data (full replace update)
			def update( visualization )
				template_data = NamedMap.get_template_data( visualization, @parent )

				response = Typhoeus.put( url + '?api_key=' + @parent.api_key, {
					headers: @parent.headers,
					body: ::JSON.dump( template_data )
				} )

				if response.code == 200
					@template = template_data
					true
				else
					raise HTTPResponseError, response.code
				end
			end #update

			# Delete existing named map
			def delete
				response = Typhoeus.delete( url + "?api_key=" + @parent.api_key )
				response.code == 204
			end #delete

			# Url to access a named map's tiles
			def url
				[ @parent.url, @name ].join('/')
			end # url

			# Normalize a name to make it "named map valid"
			def self.normalize_name( raw_name )
				( NAME_PREFIX + raw_name ).gsub( /[^a-zA-Z0-9\-\_.]/ , '' ).gsub( '-', '_' )
			end # self.normalize_name

			def self.get_template_data( visualization, parent )
				presenter_options = { full: false, user_name: parent.username }

        # Layers are zero-based on the client
        layer_num = 0

				# 1) general data
				template_data = {
					version: 	NAMED_MAPS_VERSION,
					name: 		self.normalize_name(visualization.id),
					auth: {
						# TODO: Implement tokens
            method: 	AUTH_TYPE_OPEN
          },
          placeholders: {
          },
          layergroup: {
        		layers: []
        	}
        }

        vizjson = CartoDB::Visualization::VizJSON.new( visualization, presenter_options, parent.vizjson_config )
        layers_data = []

        layer_group = vizjson.layer_group_for( visualization )
        if ( !layer_group.nil?() )
        	layer_group[:options][:layer_definition][:layers].each { |layer|

            layer_options = layer[:options].except [ :sql, :interactivity ]

            layer_placeholder = "layer#{layer_num}"
            layer_num += 1
            layer_options[:sql] = "WITH wrapped_query AS (#{layer[:options][:sql]}) SELECT * from wrapped_query where <%= #{layer_placeholder} %>=1"

            template_data[:placeholders][layer_placeholder.to_sym()] = {
              type:     'number',
              default:  1
            }

	        	if ( layer.include?( :infowindow ) && !layer[:infowindow].nil? && 
	        			 layer[:infowindow].fetch('fields').size > 0 )
	        	
              layer_options[:interactivity] = layer[:options][:interactivity]

	        		layer_options[:attributes] = {
        				id: 'cartodb_id', 
	        			columns: layer[:infowindow]['fields'].map { |field|
		        			field.fetch('name')
		        		}
	        		}
	        	end

	          layers_data.push( {
              type:     layer[:type].downcase,
              options:  layer_options
            } )
	        }
        end
        
        other_layers = vizjson.other_layers_for( visualization )
        if ( !other_layers.nil?() )
        	other_layers = other_layers.compact
        	other_layers.each { |layer|
        		sql_query = layer[:options].fetch( 'query' )

        		options = {
	            	cartocss_version: '2.0.1',
	            	cartocss: 				layer[:options].fetch( 'tile_style' ),
	            	sql: 							sql_query
	            }

        		layers_data.push( {
	            type:     layer[:type].downcase,
	            options:  options
	          } )
        	}
        end

        template_data[:layergroup][:layers] = layers_data.compact().flatten()

				template_data
			end #get_template_data

			attr_reader	:template

		end #NamedMap

  end #NamedMapsWrapper
end #CartoDB