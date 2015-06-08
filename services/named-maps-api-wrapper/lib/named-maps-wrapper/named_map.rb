# encoding: utf-8

require_relative '../../../../app/models/visualization/vizjson'
require_relative '../../../../lib/carto/http/client'

module CartoDB
  module NamedMapsWrapper

    class NamedMap
      NAMED_MAPS_VERSION  = '0.0.1'
      NAME_PREFIX = 'tpl_'
      AUTH_TYPE_OPEN = 'open'
      AUTH_TYPE_SIGNED = 'token'
      EMPTY_CSS = '#dummy{}'

      # in seconds
      HTTP_CONNECT_TIMEOUT = 45
      HTTP_REQUEST_TIMEOUT = 60

      # Load with existing data
      def initialize( name, template_data, parent )
        raise NamedMapDataError, 'Name empty' if name.nil? or name.length == 0
        @name = name

        raise NamedMapDataError, 'Invalid parent named maps instance' if parent.nil?
        @parent = parent

        @template = template_data
      end

      # Create a new named map
      # @throws HTTPResponseError
      def self.create_new( visualization, parent )
        template_data = NamedMap.get_template_data( visualization, parent )

        response = http_client.post( parent.url + '?api_key=' + parent.api_key, {
          headers:          parent.headers,
          body:             ::JSON.dump( template_data ),
          ssl_verifypeer:   parent.verify_cert,
          ssl_verifyhost:   parent.verify_host,
          followlocation:   true,
          connecttimeout:  HTTP_CONNECT_TIMEOUT,
          timeout:          HTTP_REQUEST_TIMEOUT
          } )

        unless response.code == 200
          raise HTTPResponseError.new("POST:#{response.code} #{response.request.url} #{response.body}", template_data)
        end

        body = ::JSON.parse(response.response_body)

        raise HTTPResponseError, "Missing template_id at response: #{response.response_body}" unless body['template_id'].present?

        self.new( body['template_id'], template_data, parent )
      end

      # Update a named map's template data (full replace update)
      def update( visualization )
        @template = NamedMap.get_template_data( visualization, @parent )

        retries = 0
        success = true
        begin
          response = self.class.http_client.put( url + '?api_key=' + @parent.api_key, {
            headers:          @parent.headers,
            body:             ::JSON.dump( @template ),
            ssl_verifypeer:   @parent.verify_cert,
            ssl_verifyhost:   @parent.verify_host,
            followlocation:   true,
            connecttimeout:  HTTP_CONNECT_TIMEOUT,
            timeout:          HTTP_REQUEST_TIMEOUT
          } )

          if response.code == 200
            success = true
          elsif response.code == 400 && response.body =~ /is locked/i && retries < 3
            sleep(2**retries)
            ## We hit a Tiler lock, wait and retry
            retries += 1
          else
            raise HTTPResponseError.new("PUT:#{response.code} #{response.request.url} #{response.body}", @template)
          end
        end until success
        @template
      end

      # Delete existing named map
      def delete
        response = self.class.http_client.delete( url + '?api_key=' + @parent.api_key,
          { 
            headers:          @parent.headers,
            ssl_verifypeer:   @parent.verify_cert,
            ssl_verifyhost:   @parent.verify_host,
            followlocation:   true,
            connecttimeout:  HTTP_CONNECT_TIMEOUT,
            timeout:          HTTP_REQUEST_TIMEOUT
          } )
        raise HTTPResponseError, "DELETE:#{response.code} #{response.request.url} #{response.body}" unless response.code == 204
      end

      # Url to access a named map's tiles
      def url
        [ @parent.url, @name ].join('/')
      end

      # Normalize a name to make it "named map valid"
      def self.normalize_name( raw_name )
        (NAME_PREFIX + raw_name).gsub(/[^a-zA-Z0-9\-\_.]/, '').gsub('-', '_')
      end

      def self.get_template_data( visualization, parent )
        presenter_options = {
          full: false, 
          user_name: parent.username, 
          viewer_user: User.where(username: parent.username).first
        }

        # Layers are zero-based on the client
        layer_num = 0

        auth_type = (visualization.password_protected? || visualization.organization?) ? AUTH_TYPE_SIGNED : AUTH_TYPE_OPEN

        # 1) general data
        template_data = {
          version:      NAMED_MAPS_VERSION,
          name:         self.normalize_name(visualization.id),
          auth:         {
                          method:   auth_type
                        },
          placeholders: { },
          layergroup:   {
                          layers: []
                        }
        }

        if auth_type == AUTH_TYPE_SIGNED
          if visualization.password_protected?
            auth_token = visualization.make_auth_token
            template_data[:auth][:valid_tokens] = [ auth_token ]
          elsif visualization.organization?
            org_allowed_users = visualization.all_users_with_read_permission
            org_allowed_tokens = org_allowed_users.map { |user|
              user.get_auth_tokens
            }.flatten.uniq
            template_data[:auth][:valid_tokens] = org_allowed_tokens
          end
        end

        vizjson = CartoDB::Visualization::VizJSON.new(visualization, presenter_options, parent.vizjson_config)
        layers_data = []

        layer_group = vizjson.named_map_layer_group_for(visualization)
        unless layer_group.nil?
          layer_group[:options][:layer_definition][:layers].each { |layer|
            layer_type = layer[:type].downcase
            if layer_type == 'cartodb'
              name = 'cartodb'
              data = self.options_for_cartodb_layer(layer, layer_num, template_data)
            else
              name = 'http'
              data = self.options_for_basemap_layer(layer, layer_num, template_data)
            end

            layer_num = data[:layer_num]
            template_data = data[:template_data]

            layers_data.push( {
              type:     name,
              options:  data[:layer_options]
            } )
          }
        end
        
        other_layers = vizjson.other_layers_for(visualization)
        unless other_layers.nil?
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

        template_data[:layergroup][:layers] = layers_data.compact.flatten
        template_data[:layergroup][:stat_tag] = visualization.id

        template_data
      end

      def self.css_from(options)
        options.fetch('tile_style').strip.empty? ? EMPTY_CSS : options.fetch('tile_style')
      end

      attr_reader :template

      private

      def self.options_for_cartodb_layer(layer, layer_num, template_data)
        layer_options = layer[:options].except [:sql, :interactivity]

        layer_placeholder = "layer#{layer_num}"
        layer_num += 1
        layer_options[:sql] = "SELECT * FROM (#{layer[:options][:sql]}) AS wrapped_query WHERE <%= #{layer_placeholder} %>=1"

        template_data[:placeholders][layer_placeholder.to_sym] = {
          type:     'number',
          default:  layer[:visible] ? 1: 0
        }

        if layer.include?(:infowindow) && !layer[:infowindow].nil? && !layer[:infowindow].fetch('fields').nil? && layer[:infowindow].fetch('fields').size > 0
          layer_options[:interactivity] = layer[:options][:interactivity]
          layer_options[:attributes] = {
            id:       'cartodb_id', 
            columns:  layer[:infowindow]['fields'].map { |field|
                      field.fetch('name')
            }
          }
        end

        { 
          layer_options: layer_options,
          layer_num: layer_num,
          template_data: template_data
        }
      end

      def self.options_for_basemap_layer(layer, layer_num, template_data)
        layer_options = {
          urlTemplate: layer[:options]['urlTemplate']
        }

        if layer[:options].include?('subdomains')
          layer_options[:subdomains] = layer[:options]['subdomains']
        end

        layer_num += 1

        { 
          layer_options: layer_options,
          layer_num: layer_num,
          template_data: template_data
        }
      end

      def self.http_client
        @@http_client ||= Carto::Http::Client.get('named_map')
      end

    end
  end
end
