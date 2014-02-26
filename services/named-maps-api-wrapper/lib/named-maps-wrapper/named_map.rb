# encoding: utf-8

require_relative '../../../../app/models/visualization/vizjson'

module CartoDB
  module NamedMapsWrapper

		class NamedMap
			NAMED_MAPS_VERSION  = '0.0.1'
			NAME_PREFIX = 'tpl_'
			AUTH_TYPE_OPEN = 'open'
			AUTH_TYPE_SIGNED = 'token'
      EMPTY_CSS = '#dummy{}'

			# Load with existing data
			def initialize( name, template_data, parent )
				raise NamedMapDataError, 'Name empty' if name.nil? or name.length == 0
				@name = name

				raise NamedMapDataError, 'Invalid parent named maps instance' unless parent.kind_of?( CartoDB::NamedMapsWrapper::NamedMaps)
				@parent = parent

				@template = template_data
			end #initialize

			# Create a new named map
			def self.create_new( visualization, parent )
				template_data = NamedMap.get_template_data( visualization, parent )

				response = Typhoeus.post( parent.url + '?api_key=' + parent.api_key, {
					headers:         parent.headers,
					body:            ::JSON.dump( template_data ),
          ssl_verifypeer:  parent.verify_cert,
          ssl_verifyhost:  parent.verify_cert ? 0 : 2,
          followlocation: true
					} )
        raise HTTPResponseError, "#{response.code} #{response.request.url} (POST)" unless response.code == 200

				body = ::JSON.parse(response.response_body)
				self.new( body['template_id'], template_data, parent )
			end #self.create_new

			# Update a named map's template data (full replace update)
			def update( visualization )
        @template = NamedMap.get_template_data( visualization, @parent )

				response = Typhoeus.put( url + '?api_key=' + @parent.api_key, {
					headers: @parent.headers,
					body: ::JSON.dump( @template ),
          ssl_verifypeer: @parent.verify_cert,
          ssl_verifyhost: @parent.verify_cert ? 0 : 2,
          followlocation: true
				} )

        raise HTTPResponseError, "#{response.code} #{response.request.url} (PUT)" unless response.code == 200
        @template
			end #update

			# Delete existing named map
			def delete()
				response = Typhoeus.delete( url + "?api_key=" + @parent.api_key, 
          { 
            headers: @parent.headers,
            ssl_verifypeer: @parent.verify_cert,
            ssl_verifyhost: @parent.verify_cert ? 0 : 2,
            followlocation: true
          } )
        raise HTTPResponseError, "#{response.code} #{response.request.url} (DELETE)" unless response.code == 204
			end #delete

			# Url to access a named map's tiles
			def url()
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

        auth_type = visualization.password_protected? ? AUTH_TYPE_SIGNED : AUTH_TYPE_OPEN

				# 1) general data
				template_data = {
					version:      NAMED_MAPS_VERSION,
					name: 		    self.normalize_name(visualization.id),
    			auth:         {
                          method: 	auth_type
                        },
          placeholders: { },
          layergroup:   {
                    		  layers: []
                    	  }
        }

        if (auth_type == AUTH_TYPE_SIGNED)
          auth_token = visualization.make_auth_token()
          template_data[:auth][:valid_tokens] = [ auth_token ];
        end

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
        				id:       'cartodb_id', 
	        			columns:  layer[:infowindow]['fields'].map { |field|
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
        	other_layers.compact.each { |layer|
        		layers_data.push( {
	            type:     layer[:type].downcase,
	            options:  {
                          cartocss_version: '2.0.1',
                          cartocss:         self.css_from(layer[:options]),
                          sql:              layer[:options].fetch( 'query' )
                        }
	          } )
        	}
        end

        template_data[:layergroup][:layers] = layers_data.compact().flatten()

				template_data
			end #get_template_data

      def self.css_from(options)
        options.fetch('tile_style').strip.empty? ? EMPTY_CSS : options.fetch('tile_style')
      end #css_from


			attr_reader	:template

		end #NamedMap

  end #NamedMapsWrapper
end #CartoDB