# encoding: utf-8

require_relative '../../../../lib/carto/http/client'
require_relative '../../../../lib/cartodb/stats/editor_apis'

module CartoDB
  module NamedMapsWrapper
    class NamedMaps

      def initialize(user_config, tiler_config, vizjson_config = {})
        raise NamedMapsDataError, { 'user' => 'config missing' } if user_config.nil? or user_config.size == 0
        raise NamedMapsDataError, { 'tiler' => 'config missing' } if tiler_config.nil? or tiler_config.size == 0

        @username = user_config[:name]
        @api_key = user_config[:api_key]
        @vizjson_config = vizjson_config
        @verify_cert = tiler_config[:verifycert]
        @verify_host = tiler_config[:verifycert] ? 2 : 0
        domain = CartoDB.subdomainless_urls? ? tiler_config[:domain] : "#{@username}.#{tiler_config[:domain]}"
        host_ip = Cartodb.config[:tiler]['internal']['host'].blank? ? domain : Cartodb.config[:tiler]['internal']['host']
        @host = "#{tiler_config[:protocol]}://#{host_ip}:#{tiler_config[:port]}" + (CartoDB.subdomainless_urls? ? "/user/#{@username}" : "")
        @url = [ @host, 'api', 'v1', 'map', 'named' ].join('/')
        @headers = {
          'content-type' => 'application/json',
          'host' => domain
        }
      end

      def namedmaps_logger
        @@namedmaps_logger ||= ::Logger.new("#{Rails.root}/log/named_maps.log")
      end

      # Create a new named map and return its instance (or nil if couldn't create)
      def create(visualization)
        # INFO: No stats loging here because NamedMap does it itself inside
        NamedMap.create_new(visualization, self)
      end

      # Retrieve a list of all named maps
      def all
        stats_aggregator.timing('named-maps.all') do
          request_time = Time.now
          response = stats_aggregator.timing('call') do
              http_client.get(@url + '?api_key=' + @api_key, {
              headers:          @headers,
              ssl_verifypeer:   @verify_cert,
              ssl_verifyhost:   @verify_host,
              followlocation:   true,
              connecttimeout:  NamedMap::HTTP_CONNECT_TIMEOUT,
              timeout:          NamedMap::HTTP_REQUEST_TIMEOUT
            })
          end
          raise HTTPResponseError, "GET:#{response.code} #{response.request.url} #{response.body}" if response.code != 200
          namedmaps_logger.info({
            named_map_call: 'list',
            username: self.username,
            tiler_response_time: (response.total_time * 1000).round,
            requested_at: request_time
          }.to_json)

          ::JSON.parse(response.response_body)
        end
      end

      # Get a specific named map given it's name
      def get(name)
        stats_aggregator.timing('named-maps.get') do
          raise NamedMapsDataError, { 'name' => 'mising' } if name.nil? or name.length == 0

          request_time = Time.now

          response = stats_aggregator.timing('call') do
              http_client.get( [@url, name ].join('/') + '?api_key=' + @api_key, {
              headers:          @headers,
              ssl_verifypeer:   @verify_cert,
              ssl_verifyhost:   @verify_host,
              followlocation:   true,
              connecttimeout:  NamedMap::HTTP_CONNECT_TIMEOUT,
              timeout:          NamedMap::HTTP_REQUEST_TIMEOUT
            })
          end

          if response.code == 200
            template_data = ::JSON.parse(response.response_body)
            if template_data.class == Hash
              template_data = template_data.deep_symbolize_keys
            end
            named_map = NamedMap.new(name, template_data, self)
          elsif response.code == 404
            # Request ok, template with provided name not found
            named_map = nil
          else
            raise HTTPResponseError, "GET:#{response.code} #{response.request.url} #{response.body}"
          end
          namedmaps_logger.info({
            named_map_call: 'show',
            name: name,
            username: self.username,
            tiler_response_time: (response.total_time * 1000).round,
            requested_at: request_time
          }.to_json)
          return named_map
        end
      end

      attr_reader :url, :api_key, :username, :headers, :host, :vizjson_config, :verify_cert, :verify_host

      private

      def stats_aggregator
        @stats_aggregator ||= CartoDB::Stats::EditorAPIs.instance
      end

      def http_client
        @http_client ||= Carto::Http::Client.get('named_maps')
      end

    end
  end
end
