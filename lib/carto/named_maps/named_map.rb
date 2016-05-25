# encoding: utf-8

module Carto
  module NamedMaps
    class NamedMap
      NAMED_MAPS_VERSION = '0.0.1'.freeze
      NAME_PREFIX = 'tpl_'.freeze
      AUTH_TYPE_OPEN = 'open'.freeze
      AUTH_TYPE_SIGNED = 'token'.freeze
      EMPTY_CSS = '#dummy{}'.freeze
      HTTP_CONNECT_TIMEOUT = 45
      HTTP_REQUEST_TIMEOUT = 60

      def initialize(visualization, parent)
        NamedMap.stats_aggregator.timing('named-map.create') do
          template_data = Carto::NamedMaps::Template.get_template_data(visualization, parent)

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

      def load(name, template_data, parent)
        raise NamedMapDataError, 'Name empty' if name.nil? or name.length == 0
        @name = name

        raise NamedMapDataError, 'Invalid parent named maps instance' if parent.nil?
        @parent = parent

        @template = template_data
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

      def self.http_client
        @@http_client ||= Carto::Http::Client.get('named_map')
      end

    end
  end
end
