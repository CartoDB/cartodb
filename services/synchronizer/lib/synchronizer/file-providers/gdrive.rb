# encoding: utf-8

require_relative './base'
require 'google/api_client'

module CartoDB
  module Synchronizer
    module FileProviders
      class GDriveProvider < BaseProvider

        # Required for all providers
        SERVICE = 'gdrive'

        OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive'
        REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'
        FIELDS_TO_RETRIEVE = 'items(downloadUrl,exportLinks,id,modifiedDate,title)'

        # Specific of this provider
        FORMATS_TO_MIME_TYPES = {
            FORMAT_CSV =>         %W( text/csv ),
            FORMAT_EXCEL =>       %W( application/vnd.ms-excel application/vnd.google-apps.spreadsheet application/vnd.openxmlformats-officedocument.spreadsheetml.sheet ),
            FORMAT_PNG =>         %W( image/png ),
            FORMAT_JPG =>         %W( image/jpeg ),
            FORMAT_SVG =>         %W( image/svg+xml ),
            FORMAT_COMPRESSED =>  %W( application/zip ), #application/x-compressed-tar application/x-gzip application/x-bzip application/x-tar )
        }

        # Factory method
        # @return CartoDB::Synchronizer::FileProviders::GDrive
        def self.get_new(config)
          return new(config)
        end #get_new

        # Constructor (hidden)
        # @param config
        # [
        #  :application_name
        #  :client_id
        #  :client_secret
        # ]
        # @throws ConfigurationError
        def initialize(config)
          raise ConfigurationError.new('missing application_name', SERVICE) unless config.include?(:application_name)
          raise ConfigurationError.new('missing client_id', SERVICE) unless config.include?(:client_id)
          raise ConfigurationError.new('missing client_secret', SERVICE) unless config.include?(:client_secret)

          @formats = []
          @refresh_token = nil

          @client = Google::APIClient.new ({
              application_name: config.fetch(:application_name)
          })
          @drive = @client.discovered_api('drive', 'v2')

          @client.authorization.client_id = config.fetch(:client_id)
          @client.authorization.client_secret = config.fetch(:client_secret)
          @client.authorization.scope = OAUTH_SCOPE
          @client.authorization.redirect_uri = REDIRECT_URI
        end #initialize

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # @return string | nil
        def get_auth_url
          return @client.authorization.authorization_uri
        end #get_auth_url

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        # @throws AuthError
        def validate_auth_code(auth_code)
          @client.authorization.code = auth_code
          @client.authorization.fetch_access_token!
          @refresh_token = @client.authorization.refresh_token
          # TODO: Store token in backend
        rescue Google::APIClient::InvalidIDTokenError, Signet::AuthorizationError
          raise AuthError.new('validating auth code', SERVICE)
        end #validate_auth_code

        # Store token
        # Triggers generation of a valid access token for the lifetime of this instance
        # @param token string
        # @throws AuthError
        def token=(token)
          @refresh_token = token
          @client.authorization.update_token!( { refresh_token: @refresh_token } )
          @client.authorization.fetch_access_token!
        rescue Google::APIClient::InvalidIDTokenError, Signet::AuthorizationError
          raise AuthError.new('setting token', SERVICE)
        end #token=

        # Retrieve token
        # @return string | nil
        def token
          @refresh_token
        end #token

        # Perform the GDrive listing and return results
        # @param formats_filter Array : (Optional) formats list to retrieve. Leave empty for all supported formats.
        # @return [ { :id, :title, :url, :service } ]
        # @throws DownloadError
        # @throws AuthError
        def get_files_list(formats_filter=[])
          all_results = []
          setup_formats_filter(formats_filter)

          batch_request = Google::APIClient::BatchRequest.new do |result|
            raise DownloadError.new("(#{result.status}) Retrieving files: #{result.data['error']['message']}", SERVICE) if result.status != 200
            data = result.data.to_hash
            if data.include? 'items'
              data['items'].each do |item|
                all_results.push(format_item_data(item))
              end
            end
          end

          @formats.each do |mime_type|
            batch_request.add(
              api_method: @drive.files.list,
              parameters: {
                trashed:  'false',
                q:        "mime_type = '#{mime_type}'",
                fields:   FIELDS_TO_RETRIEVE
              }
            )
          end

          @client.execute(batch_request)
          all_results
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', SERVICE)
        rescue Google::APIClient::BatchError, Google::APIClient::TransmissionError
          raise DownloadError.new('getting files', SERVICE)
        end #get_files_list

        # Stores a sync table entry
        # @param id string
        # @param sync_type
        # @return bool
        # @throws DownloadError
        # @throws AuthError
        def store_chosen_file(id, sync_type)
          result = @client.execute( api_method: @drive.files.get, parameters: { fileId: id } )
          raise DownloadError.new("(#{result.status}) retrieving file #{id} metadata: #{result.data['error']['message']}", SERVICE) if result.status != 200

          item_data = format_item_data(result.data.to_hash)

          #TODO: Store
          puts item_data.to_hash
          true
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', SERVICE)
        rescue Google::APIClient::TransmissionError
          raise DownloadError.new("storing file #{id}", SERVICE)
        end #store_chosen_file

        # Checks if a file has been modified
        # @param id string
        # @return bool
        # @throws DownloadError
        # @throws AuthError
        def file_modified?(id)
          result = @client.execute( api_method: @drive.files.get, parameters: { fileId: id } )
          raise DownloadError.new("(#{result.status}) retrieving file #{id} metadata: #{result.data['error']['message']}", SERVICE) if result.status != 200

          new_item_data = format_item_data(result.data.to_hash)

          #TODO: check against stored checksum
          puts new_item_data.to_hash
          false
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', SERVICE)
        rescue Google::APIClient::TransmissionError
          raise DownloadError.new("checking if file #{id} has been modified", SERVICE)
        end #file_modified?

        # Downloads a file and returns its contents
        # @param id string
        # @return mixed
        # @throws DownloadError
        # @throws AuthError
        def download_file(id)
          result = @client.execute( api_method: @drive.files.get, parameters: { fileId: id } )
          raise DownloadError.new("(#{result.status}) retrieving file #{id} metadata for download: #{result.data['error']['message']}", SERVICE) if result.status != 200

          item_data = format_item_data(result.data.to_hash)

          result = @client.execute(uri: item_data.fetch(:url))
          raise DownloadError.new("(#{result.status}) downloading file #{id}: #{result.data['error']['message']}", SERVICE) if result.status != 200
          result.body
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', SERVICE)
        rescue Google::APIClient::TransmissionError
          raise DownloadError.new("downloading file #{id}", SERVICE)
        end #download_file

        # Prepares the list of formats that GDrive will require when performing the query
        # @param filter Array
        def setup_formats_filter(formats_filter=[])
          @formats = []
          FORMATS_TO_MIME_TYPES.each do |id, mime_types|
            if (formats_filter.empty? || formats_filter.include?(id))
              mime_types.each do |mime_type|
                @formats = @formats.push(mime_type)
              end
            end
          end
        end #setup_formats_filter

        attr_reader :formats

        private

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from GDrive API
        # @return { :id, :title, :url, :service, :checksum }
        def format_item_data(item_data)
          data =
            {
              id:           item_data.fetch('id'),
              title:        item_data.fetch('title'),
              service:      SERVICE,
              checksum:     checksum_of(item_data.fetch('modifiedDate')),
            }
          if item_data.include?('exportLinks')
            data[:url] = item_data.fetch('exportLinks').first.last
            data[:url] = data[:url][0..data[:url].rindex('=')] + 'csv'
          else
            data[:url] = item_data.fetch('downloadUrl')
          end
          data
        end #format_item_data

        # Calculates a checksum of given input
        # @param origin string
        # @return string
        def checksum_of(origin)
          Zlib::crc32(origin).to_s
        end #checksum_of

      end #GDrive
    end #FileProviders
  end #Syncronizer
end #CartoDB
