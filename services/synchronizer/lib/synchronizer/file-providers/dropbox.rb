# encoding: utf-8

require_relative './base'
require 'dropbox_sdk'

module CartoDB
  module Synchronizer
    module FileProviders
      class Dropbox < BaseProvider

        # Required for all providers
        SERVICE = 'dropbox'

        # Specific of this provider
        FORMATS_TO_SEARCH_QUERIES = {
            FORMAT_CSV =>         %W( .csv ),
            FORMAT_EXCEL =>       %W( .xls .xlsx ),
            FORMAT_PNG =>         %W( .png ),
            FORMAT_JPG =>         %W( .jpg .jpeg ),
            FORMAT_SVG =>         %W( .svg ),
            FORMAT_COMPRESSED =>  %W( .zip )
        }

        # Factory method
        # @return CartoDB::Synchronizer::FileProviders::Dropbox
        def self.get_new(config)
          return new(config)
        end #get_new

        # Constructor (hidden)
        # @param config
        # [
        #  :app_key
        #  :app_secret
        # ]
        # @param log object | nil
        def initialize(config, log=nil)
          @service_name = SERVICE

          @formats = []
          @access_token = nil
          @log = log ||= TrackRecord::Log.new

          @app_key = config.fetch(:app_key)
          @app_secret = config.fetch(:app_secret)

          @client = nil
          @auth_flow = nil
        end #initialize

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        def get_auth_url
          @auth_flow = DropboxOAuth2FlowNoRedirect.new(@app_key, @app_secret)
          @auth_flow.start()
        end #get_auth_url

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        def validate_auth_code(auth_code)
          data = @auth_flow.finish(auth_code)
          @access_token = data[0] # Only keep the access token
          @auth_flow = nil
          @client = DropboxClient.new(@access_token)
          # TODO: Store token in backend
        end #validate_auth_code

        # Store token
        # @param token string
        def token=(token)
          @access_token = token
          @client = DropboxClient.new(@access_token)
        end #token=

        # Retrieve token
        # @return string | nil
        def token
          @access_token
        end #token

        # Perform the GDrive listing and return results
        # @param formats_filter Array : (Optional) formats list to retrieve. Leave empty for all supported formats.
        # @return [ { :id, :title, :url, :service } ]
        def get_files_list(formats_filter=[])
          all_results = []
          setup_formats_filter(formats_filter)

          @formats.each do |search_query|
            response = @client.search('/', search_query)
            for item in response
              all_results.push(format_item_data(item))
            end
          end

          all_results
        end

        def store_chosen_file(id, url, service, sync_type)
          raise 'Pending implementation'
        end #store_chosen_file

        def download_file(service, id, url)
          raise 'Pending implementation'
        end #download_file

        # Prepares the list of formats that Dropbox will require when performing the query
        # @param filter Array
        def setup_formats_filter(formats_filter=[])
          @formats = []
          FORMATS_TO_SEARCH_QUERIES.each do |id, queries|
            if (formats_filter.empty? || formats_filter.include?(id))
              queries.each do |query|
                @formats = @formats.push(query)
              end
            end
          end
        end #setup_formats_filter

        attr_reader :formats

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
              service:  SERVICE
            }
          data
        end #format_item_data

      end #Dropbox
    end #FileProviders
  end #Syncronizer
end #CartoDB
