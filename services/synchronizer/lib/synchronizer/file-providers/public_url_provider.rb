# encoding: utf-8

require_relative './base'
require 'typhoeus'

module CartoDB
  module Synchronizer
    module FileProviders
      class PublicUrlProvider < BaseProvider

        # Required for all providers
        SERVICE = 'public_url'

        # Factory method
        # @return CartoDB::Synchronizer::FileProviders::PublicUrl
        def self.get_new(config={})
          return new(config)
        end #get_new

        # Constructor (hidden)
        # @param config
        # [ ]
        def initialize(config)
          @service_name = SERVICE

          @headers = nil
        end #initialize

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        def get_auth_url
          nil
        end #get_auth_url

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        def validate_auth_code(auth_code)
          nil
        end #validate_auth_code

        # Store token
        # @param token string
        def token=(token)
          nil
        end #token=

        # Retrieve token
        # @return string | nil
        def token
          nil
        end #token

        # Perform the listing and return results
        # @param formats_filter Array : (Optional) formats list to retrieve. Leave empty for all supported formats.
        # @return [ { :id, :title, :url, :service } ]
        def get_files_list(formats_filter=[])
          nil
        end

        # Stores a sync table entry
        # @param id string
        # @param sync_type
        # @return bool
        def store_chosen_file(id, sync_type)
          #TODO: Store
          puts id
          true
        end #store_chosen_file

        # Checks if a file has been modified
        # @param id string
        # @return bool
        def file_modified?(id)
          fetch_headers(id)
          new_checksum = checksum_of(id, etag_header, last_modified_header)

          #TODO: check against stored checksum
          puts id + ' ' + etag_header + ' ' + last_modified_header + new_checksum
          false
        end #file_modified?

        # Downloads a file and returns its contents
        # @param id string
        # @return mixed
        # @throws DownloadError
        def download_file(id)
          response = Typhoeus.get(id, http_options)
          while response.headers['location']
            response = Typhoeus.get(id, http_options)
          end
          raise DownloadError.new("Downloading #{id}", SERVICE) unless response.code.to_s =~ /\A[23]\d+/
          response.response_body
        end #download_file

        # Prepares the list of formats that Dropbox will require when performing the query
        # @param filter Array
        def setup_formats_filter(formats_filter=[])
        end #setup_formats_filter

        # Fetches the headers for a given url
        # @throws DownloadError
        def fetch_headers(url)
          @headers = nil  # In case of error, always leave empty the headers
          response = Typhoeus.head(url, http_options)
          raise DownloadError.new("Fetching headers of #{url}", SERVICE) unless response.code.to_s =~ /\A[23]\d+/
          @headers = response.headers
        end #headers

        # Get the etag header if present
        # @return string
        # @throws UninitializedError
        def etag_header()
          raise UninitializedError.new('headers not fetched', SERVICE) if @headers.nil?
          etag  =   @headers.fetch('ETag', nil)
          etag  ||= @headers.fetch('Etag', nil)
          etag  ||= @headers.fetch('etag', '')
          etag  = etag.delete('"').delete("'") if !etag.empty?
          etag
        end #etag_header

        # Get the last modified header if present
        # @return string
        # @throws UninitializedError
        def last_modified_header()
          raise UninitializedError.new('headers not fetched', SERVICE) if @headers.nil?
          last_modified =   @headers.fetch('Last-Modified', nil)
          last_modified ||= @headers.fetch('Last-modified', nil)
          last_modified ||= @headers.fetch('last-modified', '')
          last_modified = last_modified.delete('"').delete("'") if !last_modified.empty?
          last_modified
        end #last_modified_header

        attr_reader :formats

        private

        # Calculates a checksum of given url
        # @param origin string
        # @return string
        def checksum_of(url, etag, last_modified)
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
