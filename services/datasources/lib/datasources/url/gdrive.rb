# encoding: utf-8

require 'google/api_client'

module CartoDB
  module Datasources
    module Url
      class GDrive < BaseOAuth

        # Required for all providers
        DATASOURCE_NAME = 'gdrive'

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

        # Constructor (hidden)
        # @param config
        # [
        #  'application_name'
        #  'client_id'
        #  'client_secret'
        # ]
        # @throws ConfigurationError
        def initialize(config)
          raise ConfigurationError.new('missing application_name', DATASOURCE_NAME) unless config.include?('application_name')
          raise ConfigurationError.new('missing client_id', DATASOURCE_NAME) unless config.include?('client_id')
          raise ConfigurationError.new('missing client_secret', DATASOURCE_NAME) unless config.include?('client_secret')

          self.filter=[]
          @refresh_token = nil

          @client = Google::APIClient.new ({
              application_name: config.fetch('application_name')
          })
          @drive = @client.discovered_api('drive', 'v2')

          @client.authorization.client_id = config.fetch('client_id')
          @client.authorization.client_secret = config.fetch('client_secret')
          @client.authorization.scope = OAUTH_SCOPE
          @client.authorization.redirect_uri = REDIRECT_URI
        end #initialize

        # Factory method
        # @param config {}
        # @return CartoDB::Synchronizer::FileProviders::GDrive
        def self.get_new(config)
          return new(config)
        end #get_new

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
          raise AuthError.new('validating auth code', DATASOURCE_NAME)
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
          raise AuthError.new('setting token', DATASOURCE_NAME)
        end #token=

        # Retrieve token
        # @return string | nil
        def token
          @refresh_token
        end #token

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws DownloadError
        def get_resources_list(filter=[])
          all_results = []
          self.filter = filter

          batch_request = Google::APIClient::BatchRequest.new do |result|
            raise DownloadError.new("get_resources_list() #{result.data['error']['message']} (#{result.status})", DATASOURCE_NAME) if result.status != 200
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
          raise AuthError.new('Invalid token', DATASOURCE_NAME)
        rescue Google::APIClient::BatchError, Google::APIClient::TransmissionError
          raise DownloadError.new('getting resources', DATASOURCE_NAME)
        end #get_resources_list

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DownloadError
        # @throws AuthError
        def get_resource(id)
          result = @client.execute( api_method: @drive.files.get, parameters: { fileId: id } )
          raise DownloadError.new("(#{result.status}) retrieving file #{id} metadata for download: #{result.data['error']['message']}", DATASOURCE_NAME) if result.status != 200

          item_data = format_item_data(result.data.to_hash)

          result = @client.execute(uri: item_data.fetch(:url))
          raise DownloadError.new("(#{result.status}) downloading file #{id}: #{result.data['error']['message']}", DATASOURCE_NAME) if result.status != 200
          result.body
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', DATASOURCE_NAME)
        rescue Google::APIClient::TransmissionError
          raise DownloadError.new("downloading file #{id}", DATASOURCE_NAME)
        end #get_resource

        # Stores a sync table entry
        # @param id string
        # @param sync_type
        # @return bool
        # @throws DownloadError
        # @throws AuthError
        def store_resource(id, sync_type)
          result = @client.execute( api_method: @drive.files.get, parameters: { fileId: id } )
          raise DownloadError.new("(#{result.status}) retrieving file #{id} metadata: #{result.data['error']['message']}", DATASOURCE_NAME) if result.status != 200

          item_data = format_item_data(result.data.to_hash)

          #TODO: Store
          puts item_data.to_hash
          true
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', DATASOURCE_NAME)
        rescue Google::APIClient::TransmissionError
          raise DownloadError.new("storing file #{id}", DATASOURCE_NAME)
        end #store_resource

        # Checks if a file has been modified
        # @param id string
        # @return bool
        # @throws DownloadError
        # @throws AuthError
        def resource_modified?(id)
          result = @client.execute( api_method: @drive.files.get, parameters: { fileId: id } )
          raise DownloadError.new("(#{result.status}) retrieving file #{id} metadata: #{result.data['error']['message']}", DATASOURCE_NAME) if result.status != 200

          new_item_data = format_item_data(result.data.to_hash)

          #TODO: check against stored checksum
          puts new_item_data.to_hash
          false
        rescue Google::APIClient::InvalidIDTokenError
          raise AuthError.new('Invalid token', DATASOURCE_NAME)
        rescue Google::APIClient::TransmissionError
          raise DownloadError.new("checking if file #{id} has been modified", DATASOURCE_NAME)
        end #resource_modified?

        # Retrieves current filters
        # @return {}
        def filter
          @formats
        end #filter

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
          @formats = []
          FORMATS_TO_MIME_TYPES.each do |id, mime_types|
            if (filter_data.empty? || filter_data.include?(id))
              mime_types.each do |mime_type|
                @formats = @formats.push(mime_type)
              end
            end
          end
        end #filter=

        private

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from GDrive API
        # @return { :id, :title, :url, :service, :checksum }
        def format_item_data(item_data)
          data =
            {
              id:           item_data.fetch('id'),
              title:        item_data.fetch('title'),
              service:      DATASOURCE_NAME,
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
