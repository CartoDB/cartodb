# encoding: utf-8

require_dependency 'lib/carto/named_maps/template'
require_dependency 'lib/carto/http/client'

module Carto
  module NamedMaps
    class Api
      HTTP_CONNECT_TIMEOUT_SECONDS = 45
      HTTP_REQUEST_TIMEOUT_SECONDS = 60

      def initialize(visualization)
        @visualization = visualization
        @user = @visualization.user
      end

      def create
        stats_aggregator.timing('named-map.create') do
          params = request_params
          params[:body] = Carto::NamedMaps::Template.new(@visualization).to_json

          response = http_client.post(url, params)

          if response.code == 409 && response.body =~ /reached limit on number of templates/
            raise "Reached limit on number of named map templates"
          end

          unless response.code == 200
            raise "POST:#{response.code} #{response.request.url} #{response.body}"
          end

          body = ::JSON.parse(response.response_body)

          raise "No template_id found in #{body}" unless body['template_id'].present?
        end
      end

      def show
        stats_aggregator.timing('named-maps.get') do
          response = stats_aggregator.timing('call') do

            url = url(template_name: Carto::NamedMaps::Template.new(@visualization).name)

            response = http_client.get(url, request_params)
          end

          response_code = response.code

          if response_code == 200
            template = ::JSON.parse(response.response_body)

            template.class == Hash ? template.deep_symbolize_keys : template
          elsif response_code == 404
            nil
          else
            raise "GET:#{response_code} #{response.request.url} #{response.body}"
          end
        end
      end

      private

      def stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      def url(template_name: '')
        username = @user.username
        user_url = CartoDB.subdomainless_urls? ? "/user/#{username}" : ""

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
    end
  end
end
