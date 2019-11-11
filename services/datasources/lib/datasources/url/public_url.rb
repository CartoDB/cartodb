require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      class PublicUrl < Base

        # Required for all datasources
        DATASOURCE_NAME = 'public_url'

        URL_REGEXP = %r{://}

        # Constructor (hidden)
        # @param config
        # [ ]
        def initialize(config)
          super

          @http_timeout = config.fetch(:http_timeout, 3200)
          @http_connect_timeout = config.fetch(:http_connect_timeout, 60)
          @service_name = DATASOURCE_NAME
          @headers = nil
          @response = nil
        end

        # Factory method
        # @param config {}
        # @return CartoDB::Datasources::Url::PublicUrl
        def self.get_new(config={})
          return new(config)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          true
        end

        def get_http_response_code
          @response.code if !@response.nil? && !@response.code.nil?
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        def get_resources_list(filter=[])
          nil
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DataDownloadTimeoutError
        # @throws DataDownloadError
        def get_resource(id)
          response = http_client.get(id, http_options)
          while response.headers['location']
            response = http_client.get(id, http_options)
          end

          raise DataDownloadTimeoutError.new(DATASOURCE_NAME) if response.timed_out?

          raise DataDownloadError.new("get_resource() #{id}", DATASOURCE_NAME) unless response.code.to_s =~ /\A[23]\d+/

          # To be used in when try to retrieve the http response code
          @response = response

          response.response_body
        end

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          fetch_headers(id)
          {
              id:       id,
              title:    id,
              url:      id,
              service:  DATASOURCE_NAME,
              checksum: checksum_of(id, etag_header, last_modified_header),
              size:     content_length_header
              # No need to use :filename nor file
          }
        end

        # Fetches the headers for a given url
        # @throws DataDownloadError
        def fetch_headers(url)
          if url =~ URL_REGEXP
            response = http_client.head(url, http_options)

            raise DataDownloadTimeoutError.new(DATASOURCE_NAME) if response.timed_out?

            # For example S3 only allows one verb per signed url (we use GET) so won't allow HEAD, but it's ok
            @headers = (response.code.to_s =~ /\A[23]\d+/) ? response.headers : {}
          else
            @headers = {}
          end
        end

        # Get the etag header if present
        # @return string
        # @throws UninitializedError
        def etag_header
          raise UninitializedError.new('headers not fetched', DATASOURCE_NAME) if @headers.nil?
          etag  =   @headers.fetch('ETag', nil)
          etag  ||= @headers.fetch('Etag', nil)
          etag  ||= @headers.fetch('etag', '')
          etag  = etag.delete('"').delete("'") unless etag.empty?
          etag
        end

        # Get the last modified header if present
        # @return string
        # @throws UninitializedError
        def last_modified_header
          raise UninitializedError.new('headers not fetched', DATASOURCE_NAME) if @headers.nil?
          last_modified =   @headers.fetch('Last-Modified', nil)
          last_modified ||= @headers.fetch('Last-modified', nil)
          last_modified ||= @headers.fetch('last-modified', '')
          last_modified = last_modified.delete('"').delete("'") unless last_modified.empty?
          last_modified
        end

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        # If this datasource accepts a data import instance
        # @return Boolean
        def persists_state_via_data_import?
          false
        end

        # Stores the data import item instance to use/manipulate it
        # @param value DataImport
        def data_import_item=(value)
          nil
        end

        private

        def http_client
          @http_client ||= Carto::Http::Client.get('public_url')
        end

        # Get the file size if present
        # @return Integer
        # @throws UninitializedError
        def content_length_header
          raise UninitializedError.new('headers not fetched', DATASOURCE_NAME) if @headers.nil?
          content_length = @headers.fetch('Content-Length', nil)
          content_length ||= @headers.fetch('Content-length', nil)
          content_length ||= @headers.fetch('content-length', NO_CONTENT_SIZE_PROVIDED)
          content_length.to_i
        end

        # Calculates a checksum of given url
        # @return string
        def checksum_of(url, etag, last_modified)
          #noinspection RubyArgCount
          Zlib::crc32(url + etag + last_modified).to_s
        end

        # HTTP (Typhoeus) options
        def http_options
          {
              followlocation:   true,
              ssl_verifypeer:   false,
              ssl_verifyhost:   0,
              timeout:          @http_timeout,
              connecttimeout:  @http_connect_timeout
          }
        end

      end
    end
  end
end
