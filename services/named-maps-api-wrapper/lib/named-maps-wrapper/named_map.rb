# encoding: utf-8

require_relative '../../../../app/models/visualization/vizjson'
require_relative '../../../../lib/carto/http/client'
require_relative '../../../../lib/cartodb/stats/editor_apis'

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
      # @throws TooManyTemplatesError
      def self.create_new(visualization, parent)
        NamedMap.stats_aggregator.timing('named-map.create') do
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

          if response.code == 409 && response.body =~ /reached limit on number of templates/
            raise TooManyTemplatesError.new("Reached limit on number of named map templates")
          end

          unless response.code == 200
            raise HTTPResponseError.new("POST:#{response.code} #{response.request.url} #{response.body}", template_data)
          end

          body = ::JSON.parse(response.response_body)

          raise HTTPResponseError, "Missing template_id at response: #{response.response_body}" unless body['template_id'].present?

          self.new(body['template_id'], template_data, parent)
        end
      end

      # Update a named map's template data (full replace update)
      def update(visualization)
        NamedMap.stats_aggregator.timing('named-map.update') do
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
      end

      # Delete existing named map
      def delete
        NamedMap.stats_aggregator.timing('named-map.delete') do
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
      end

      # Url to access a named map's tiles
      def url
        [ @parent.url, @name ].join('/')
      end

      # Normalize a name to make it "named map valid"
      def self.template_name(raw_name)
        (NAME_PREFIX + raw_name).gsub(/[^a-zA-Z0-9\-\_.]/, '').gsub('-', '_')
      end

      def self.get_template_data(visualization, parent)
        NamedMap.stats_aggregator.timing('named-map.template-data') do
          presenter_options = {
            full: false,
            user_name: parent.username,
            viewer_user: ::User.where(username: parent.username).first
          }

          # Layers are zero-based on the client
          layer_num = 0

          auth_type = (visualization.password_protected? || visualization.organization?) ? AUTH_TYPE_SIGNED : AUTH_TYPE_OPEN

          # 1) general data
          template_data = {
            version:      NAMED_MAPS_VERSION,
            name:         self.template_name(visualization.id),
            auth:         {
                            method:   auth_type
                          },
            placeholders: { },
            layergroup:   {
                            layers: []
                          },
            view:         self.view_data_from(visualization)
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
              data = options_for_layer(layer, layer_num, template_data)

              unless data.nil?
                layer_num = data[:layer_num]
                template_data = data[:template_data]

                layers_data.push(
                  type:     data[:layer_name],
                  options:  data[:layer_options]
                )
              end
            }
          end

          other_layers = vizjson.other_layers_for(visualization)
          unless other_layers.nil?
            other_layers.compact.each { |layer|
              layer_data = {
                type:     layer[:type].downcase,
                options:  {
                            cartocss_version: '2.0.1',
                            cartocss:         self.css_from(layer[:options])
                          }
              }
              source = layer[:options]['source']
              if source
                layer[:options].delete('query')
                layer_data[:options][:source] = layer[:options].fetch('source')
              else
                layer_data[:options][:sql] = layer[:options].fetch('query')
              end

              layers_data.push(layer_data)
            }
          end

          layergroup = template_data[:layergroup]

          layergroup[:layers] = layers_data.compact.flatten
          layergroup[:stat_tag] = visualization.id

          widgets = Carto::Widget.from_visualization_id(visualization.id)
          if widgets.present?
            widget_names_and_options = widgets.map { |widget| [widget.id, dataview_data(widget)] }
            layergroup[:dataviews] = widget_names_and_options.to_h
          end

          analyses = Carto::Analysis.where(visualization_id: visualization.id)
          if analyses.present?
            layergroup[:analyses] = analyses.map(&:analysis_definition_json)
          end

          template_data[:view] = view_data_from(visualization)

          template_data
        end
      end

      def self.options_for_layer(layer, layer_num, template_data)
        # Gentle reminder: layer groups don't contain torque layers
        layer_type = layer[:type].downcase

        if layer_type == 'cartodb'
          data = options_for_cartodb_layer(layer, layer_num, template_data)
        else
          data = options_for_basemap_layer(layer, layer_num, template_data)
        end

        data
      end

      def self.css_from(options)
        options.fetch('tile_style').strip.empty? ? EMPTY_CSS : options.fetch('tile_style')
      end

      def self.stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      attr_reader :template

      private

      def self.view_data_from(visualization)
        center = visualization.map.center_data

        data = {
          zoom:   visualization.map.zoom,
          center: {

                    lng: center[1].to_f,
                    lat: center[0].to_f
                  }
        }

        # INFO: We grab view bounds because represent what the user usually wants to "see"
        bounds_data = visualization.map.view_bounds_data
        # INFO: Don't return 'bounds' if all points are 0 to avoid static map trying to go too small zoom level
        if bounds_data[:west] != 0 || bounds_data[:south] != 0 || bounds_data[:east] != 0 || bounds_data[:north] != 0
          data[:bounds] = bounds_data
        end

        data
      end

      # @return Hash {
      #               layer_options: Hash,
      #               layer_num: Integer,
      #               template_data: Hash
      #              }
      def self.options_for_cartodb_layer(layer, layer_num, template_data)
        layer_options = layer[:options].except [:sql, :interactivity]

        layer_placeholder = "layer#{layer_num}"
        layer_num += 1

        unless layer_options[:source]
          layer_options[:sql] = "SELECT * FROM (#{layer[:options][:sql]}) AS wrapped_query WHERE <%= #{layer_placeholder} %>=1"
        end

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

        layer_options = {
          layer_name: 'cartodb',
          layer_options: layer_options,
          layer_num: layer_num,
          template_data: template_data
        }

        layer_options
      end

      TILER_WIDGET_TYPES = {
        'category' => 'aggregation',
        'formula' => 'formula',
        'histogram' => 'histogram',
        'list' => 'list',
        'time-series' => 'histogram'
      }.freeze

      def self.dataview_data(widget)
        options = widget.options_json
        options[:aggregationColumn] = options[:aggregation_column]
        options.delete(:aggregation_column)

        {
          type: TILER_WIDGET_TYPES[widget.type],
          options: options
        }
      end

      # @return Hash {
      #               layer_options: Hash,
      #               layer_num: Integer,
      #               template_data: Hash
      #              }
      def self.options_for_basemap_layer(layer, layer_num, template_data)
        if layer[:options]['type'] == 'Plain'
          if layer[:options]['image'].length > 0
            background_image_basemap_layer(layer, layer_num, template_data)
          else
            plain_color_basemap_layer(layer, layer_num, template_data)
          end
        else
          valid_http_basemap_layer?(layer) ? http_basemap_layer(layer, layer_num, template_data) : nil
        end
      end

      def self.valid_http_basemap_layer?(layer)
        layer[:options]['urlTemplate'] && layer[:options]['urlTemplate'].length > 0
      end

      def self.http_basemap_layer(layer, layer_num, template_data)
        layer_options = {
          urlTemplate: layer[:options]['urlTemplate']
        }
        if layer[:options].include?('subdomains')
          layer_options[:subdomains] = layer[:options]['subdomains']
        end

        {
          layer_name: 'http',
          layer_options: layer_options,
          # Basemap layers don't increment layer index/number
          layer_num: layer_num,
          template_data: template_data
        }
      end

      def self.background_image_basemap_layer(layer, layer_num, template_data)
        layer_options = {
          imageUrl: layer[:options]['image']
        }
        plain_layer(layer_options, layer_num, template_data)
      end

      def self.plain_color_basemap_layer(layer, layer_num, template_data)
        layer_options = {
          color: layer[:options]['color']
        }
        plain_layer(layer_options, layer_num, template_data)
      end

      def self.plain_layer(layer_options, layer_num, template_data)
        {
          layer_name: 'plain',
          layer_options: layer_options,
          # Basemap layers don't increment layer index/number
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
