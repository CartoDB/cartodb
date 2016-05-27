# encoding: utf-8

require_dependency 'lib/carto/named_maps/template'
require_dependency 'lib/carto/http/client'

module Carto
  module NamedMaps
    class Api
      HTTP_CONNECT_TIMEOUT_SECONDS = 45
      HTTP_REQUEST_TIMEOUT_SECONDS = 60

      def create(visualization)
        stats_aggregator.timing('named-map.create') do
          template_data = Carto::NamedMaps::Template.new(visualization).generate_template

          response = http_client.post(url(visualization.user.api_key), request_params(template_data))

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

      private

      def stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      def url(api_key)
        "#{host}/api/v1/map/named?api_key=#{api_key}"
      end

      def headers
        @headers ||= {
          'content-type': 'application/json',
          'host': domain
        }
      end

      def request_params(template)
        {
          headers: headers,
          body: ::JSON.dump(template),
          ssl_verifypeer: ssl_verifypeer,
          ssl_verifyhost: ssl_verifyhost,
          followlocation: true,
          connecttimeout: HTTP_CONNECT_TIMEOUT_SECONDS,
          timeout: HTTP_REQUEST_TIMEOUT_SECONDS
        }
      end

      def domain
        @domain ||= Cartodb.config[:tiler]['internal']['domain']
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

      def host
        @host ||= Cartodb.config[:tiler]['internal']['host']
      end

      def http_client
        @http_client ||= Carto::Http::Client.get('named_maps')
      end
    end
  end
end
