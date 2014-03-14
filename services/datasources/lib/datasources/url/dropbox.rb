# encoding: utf-8

require 'dropbox_sdk'

module CartoDB
  module Datasources
    module Url
      class Dropbox < BaseOAuth

        # Required for all datasources
        DATASOURCE_NAME = 'dropbox'

        # Specific of this datasource
        FORMATS_TO_SEARCH_QUERIES = {
            FORMAT_CSV =>         %W( .csv ),
            FORMAT_EXCEL =>       %W( .xls .xlsx ),
            FORMAT_PNG =>         %W( .png ),
            FORMAT_JPG =>         %W( .jpg .jpeg ),
            FORMAT_SVG =>         %W( .svg ),
            FORMAT_COMPRESSED =>  %W( .zip )
        }

        # Constructor (hidden)
        # @param config
        # [
        #  'app_key'
        #  'app_secret'
        # ]
        # @param user User
        # @throws UninitializedError
        # @throws ConfigurationError
        def initialize(config, user)
          @access_token = nil

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?
          raise ConfigurationError.new('missing app_key', DATASOURCE_NAME) unless config.include?('app_key')
          raise ConfigurationError.new('missing app_secret', DATASOURCE_NAME) unless config.include?('app_secret')

          @app_key = config.fetch('app_key')
          @app_secret = config.fetch('app_secret')
          @user = user

          self.filter=[]

          @client = nil
          @auth_flow = nil
        end #initialize

        # Factory method
        # @param config {}
        # @param user User
        # @return CartoDB::Synchronizer::FileProviders::Dropbox
        def self.get_new(config, user)
          return new(config, user)
        end #get_new

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # @throws AuthError
        def get_auth_url
          @auth_flow = DropboxOAuth2FlowNoRedirect.new(@app_key, @app_secret)
          @auth_flow.start()
        rescue DropboxError, ArgumentError
          raise AuthError.new('get_auth_url()', DATASOURCE_NAME)
        end #get_auth_url

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        # @throws AuthError
        def validate_auth_code(auth_code)
          data = @auth_flow.finish(auth_code)
          @access_token = data[0] # Only keep the access token
          @auth_flow = nil
          @client = DropboxClient.new(@access_token)
          # TODO: Store token in backend
        rescue DropboxError, ArgumentError
          raise AuthError.new('validate_auth_code()', DATASOURCE_NAME)
        end #validate_auth_code

        # Store token
        # @param token string
        # @throws AuthError
        def token=(token)
          @access_token = token
          @client = DropboxClient.new(@access_token)
        rescue DropboxError, ArgumentError
          raise AuthError.new('token=', DATASOURCE_NAME)
        end #token=

        # Retrieve token
        # @return string | nil
        def token
          @access_token
        end #token

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws DownloadError
        def get_resources_list(filter=[])
          all_results = []
          self.filter = filter

          @formats.each do |search_query|
            response = @client.search('/', search_query)
            response.each do |item|
              all_results.push(format_item_data(item))
            end
          end
          all_results
        rescue DropboxError, ArgumentError
          raise DownloadError.new('get_resources_list()', DATASOURCE_NAME)
        end #get_resources_list

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DownloadError
        def get_resource(id)
          contents, metadata = @client.get_file_and_metadata(id)
          return contents
        rescue DropboxError, ArgumentError
          raise DownloadError.new("get_resource() #{id}", DATASOURCE_NAME)
        end #get_resource

        # Stores a sync table entry
        # @param id string
        # @param {} sync_options
        # @return bool
        # @throws DownloadError
        def store_resource(id, sync_options={})
          item_data = nil
          response = @client.metadata(id)
          item_data = format_item_data(response)

          #TODO: Store
          puts item_data.to_hash
          true
        rescue DropboxError, ArgumentError
          raise DownloadError.new("store_resource() #{id}", DATASOURCE_NAME)
        end #store_resource

        # Checks if a specific resource has been modified
        # @param id string
        # @return bool
        # @throws DownloadError
        def resource_modified?(id)
          new_item_data = nil
          response = @client.metadata(id)
          new_item_data = format_item_data(response)

          #TODO: check against stored checksum
          puts item_data.to_hash
          false
        rescue DropboxError, ArgumentError
          raise DownloadError.new("resource_modified?() #{id}", DATASOURCE_NAME)
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
          FORMATS_TO_SEARCH_QUERIES.each do |id, queries|
            if (filter_data.empty? || filter_data.include?(id))
              queries.each do |query|
                @formats = @formats.push(query)
              end
            end
          end
        end #filter=

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        private

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from Dropbox API
        # @return { :id, :title, :url, :service }
        def format_item_data(item_data)
          data =
            {
              id:       item_data.fetch('path'),
              title:    item_data.fetch('path'),
              url:      '',
              service:  DATASOURCE_NAME,
              checksum: checksum_of(item_data.fetch('rev'))
            }
          data
        end #format_item_data

        # Calculates a checksum of given input
        # @param origin string
        # @return string
        def checksum_of(origin)
          Zlib::crc32(origin).to_s
        end #checksum_of

      end #Dropbox
    end #FileProviders
  end #Syncronizer
end #CartoDB
