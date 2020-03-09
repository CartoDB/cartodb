require_relative 'template'
require_relative '../http/client'
require_dependency 'carto/named_maps/template'

module Carto
  module NamedMaps
    class Api
      HTTP_CONNECT_TIMEOUT_SECONDS = 45
      HTTP_REQUEST_TIMEOUT_SECONDS = 60
      RETRY_TIME_SECONDS = 2
      MAX_RETRY_ATTEMPTS = 3

      def initialize(visualization)
        @user = visualization.user
        @named_map_template = Carto::NamedMaps::Template.new(visualization)
      end

      def index
        stats_aggregator.timing('carto-named-maps-api.index') do
          response = stats_aggregator.timing('call') do
            http_client.get(url, request_params)
          end

          if response.code.to_s =~ /^2/
            ::JSON.parse(response.response_body).deep_symbolize_keys
          else
            log_response(response, 'index')
          end
        end
      end

      def create
        stats_aggregator.timing('carto-named-maps-api.create') do
          params = request_params
          params[:body] = @named_map_template.to_json

          response = http_client.post(url, params)

          response_code = response.code
          if response_code.to_s =~ /^2/
            ::JSON.parse(response.response_body).deep_symbolize_keys
          elsif response_code != 409 # Ignore when max number of templates is reached
            log_response(response, 'create')
          end
        end
      end

      def show
        stats_aggregator.timing('carto-named-maps-api.show') do
          response = stats_aggregator.timing('call') do
            url = url(template_name: @named_map_template.name)

            response = http_client.get(url, request_params)
          end

          response_code = response.code
          if response_code.to_s =~ /^2/
            ::JSON.parse(response.response_body).deep_symbolize_keys
          else
            log_response(response, 'show') unless response_code == 404
          end
        end
      end

      def update(retries: 0)
        stats_aggregator.timing('carto-named-maps-api.update') do
          params = request_params
          params[:body] = @named_map_template.to_json

          response = http_client.put(url(template_name: @named_map_template.name), params)

          response_code_string = response.code.to_s
          if response_code_string =~ /^2/
            ::JSON.parse(response.response_body).deep_symbolize_keys
          elsif response_code_string =~ /^5/ && retries < MAX_RETRY_ATTEMPTS
            sleep(RETRY_TIME_SECONDS**retries)
            update(retries: retries + 1)
          else
            log_response(response, 'update')
          end
        end
      end

      def destroy
        stats_aggregator.timing('carto-named-maps-api.destroy') do
          url = url(template_name: @named_map_template.name)

          response = http_client.delete(url, request_params)

          response_code = response.code
          if response_code.to_s =~ /^2/
            response.response_body
          else
            log_response(response, 'destroy') unless response_code == 404
          end
        end
      end

      def upsert
        show ? update : create
      end

      private

      def stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      def url(template_name: '')
        username = @user.username
        user_url = CartoDB.subdomainless_urls? ? "/user/#{username}" : ''

        "#{protocol}://#{host(username)}:#{port}#{user_url}/api/v1/map/named/#{template_name}?api_key=#{@user.api_key}"
      end

      def request_params
        {
          headers: headers(@user.username),
          ssl_verifypeer: ssl_verifypeer,
          ssl_verifyhost: ssl_verifyhost,
          followlocation: true,
          connecttimeout: HTTP_CONNECT_TIMEOUT_SECONDS,
          timeout: HTTP_REQUEST_TIMEOUT_SECONDS
        }
      end

      def headers(username)
        @headers ||= {
          'content-type': 'application/json',
          'host': domain(username)
        }
      end

      def domain(username)
        return @domain if @domain

        config_domain = Cartodb.config[:tiler]['internal']['domain']

        CartoDB.subdomainless_urls? ? config_domain : "#{username}.#{config_domain}"
      end

      def port
        @port ||= Cartodb.config[:tiler]['internal']['port']
      end

      def protocol
        @protocol ||= Cartodb.config[:tiler]['internal']['protocol']
      end

      def ssl_verifypeer
        @verifycert ||= Cartodb.config[:tiler]['internal']['verifycert']
      end

      def ssl_verifyhost
        ssl_verifypeer ? 2 : 0
      end

      def host(username)
        return @host if @host

        config_host = Cartodb.config[:tiler]['internal']['host']

        @host ||= config_host.blank? ? domain(username) : config_host
      end

      def http_client
        @http_client ||= Carto::Http::Client.get('named_maps')
      end

      def log_response(response, action)
        CartoDB::Logger.error(
          message: 'Named Maps Api',
          action: action,
          user: @user,
          response_code: response.code,
          url: response.request.url,
          body: response.body
        )
      end
    end
  end
end
