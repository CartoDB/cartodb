# encoding: utf-8

require 'typhoeus'

module CartoDB
  module Datasources
    module Url
      class PublicUrl < Base

        # Required for all datasources
        DATASOURCE_NAME = 'public_url'

        # Constructor (hidden)
        # @param config
        # [ ]
        def initialize(config)
          @service_name = DATASOURCE_NAME

          @headers = nil
        end #initialize

        # Factory method
        # @param config {}
        # @return CartoDB::Datasources::Url::PublicUrl
        def self.get_new(config={})
          return new(config)
        end #get_new

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          true
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        def get_resources_list(filter=[])
          nil
        end #get_resources_list

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DownloadError
        def get_resource(id)
          response = Typhoeus.get(id, http_options)
          while response.headers['location']
            response = Typhoeus.get(id, http_options)
          end
          raise DownloadError.new("get_resource() #{id}", DATASOURCE_NAME) unless response.code.to_s =~ /\A[23]\d+/
          response.response_body
        end #get_resource

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          fetch_headers(id)
          {
              id:       id,
              title:    id,
              url:      id,
              service:  DATASOURCE_NAME,
              checksum: checksum_of(id, etag_header, last_modified_header)
              # No need to use :filename
          }
        end #get_resource_metadata

        # Checks if a specific resource has been modified
        # @param id string
        # @return bool
        def resource_modified?(id)
          fetch_headers(id)
          new_checksum = checksum_of(id, etag_header, last_modified_header)

          #TODO: check against stored checksum
          puts id + ' ' + etag_header + ' ' + last_modified_header + new_checksum
          false
        end #resource_modified?

        # Fetches the headers for a given url
        # @throws DownloadError
        def fetch_headers(url)
          @headers = nil  # In case of error, always leave empty the headers
          response = Typhoeus.head(url, http_options)
          raise DownloadError.new("Fetching headers of #{url}", DATASOURCE_NAME) unless response.code.to_s =~ /\A[23]\d+/
          @headers = response.headers
        end #fetch_headers

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
        end #etag_header

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
        end #last_modified_header

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        private

        # Calculates a checksum of given url
        # @return string
        def checksum_of(url, etag, last_modified)
          #noinspection RubyArgCount
          Zlib::crc32(url + etag + last_modified).to_s
        end #checksum_of

        # HTTP (Typhoeus) options
        def http_options
          {
              followlocation: true,
              ssl_verifypeer: false,
              ssl_verifyhost: 0
          }
        end #http_options

      end #Dropbox
    end #FileProviders
  end #Syncronizer
end #CartoDB
