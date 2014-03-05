# encoding: utf-8

require_relative './base'
require 'google/api_client'

module CartoDB
  module Synchronizer
    module FileProviders
      class GDrive < BaseProvider

        # Required for all providers
        SERVICE = 'gdrive'

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
        # @param log object | nil
        def initialize(config, log=nil)
          @service_name = SERVICE

          @formats = []
          @refresh_token = nil
          @log = log ||= TrackRecord::Log.new

          @client = Google::APIClient.new ({
              application_name: config.fetch(:application_name)
          })
          @drive = @client.discovered_api('drive', 'v2')

          @client.authorization.client_id = config.fetch(:client_id)
          @client.authorization.client_secret = config.fetch(:client_secret)
          @client.authorization.scope = oauth_scope
          @client.authorization.redirect_uri = redirect_uri
        end #initialize

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        def get_auth_url
          return @client.authorization.authorization_uri
        end #get_auth_url

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        def validate_auth_code(auth_code)
          @client.authorization.code = auth_code
          @client.authorization.fetch_access_token!
          @refresh_token = @client.authorization.refresh_token
          # TODO: Store token in backend
        end #validate_auth_code

        # Store token
        # Triggers generation of a valid access token for the lifetime of this instance
        # @param token string
        def token=(token)
          @refresh_token = token
          @client.authorization.update_token!( { refresh_token: @refresh_token } )
          @client.authorization.fetch_access_token!
        end #token=

        # Retrieve token
        # @return string | nil
        def token
          @refresh_token
        end #token

        # Perform the GDrive listing and return results
        # @param formats_filter Array : (Optional) formats list to retrieve. Leave empty for all supported formats.
        # @return [ { :id, :title, :url, :service } ]
        def get_files_list(formats_filter=[])
          all_results = []
          setup_formats_filter(formats_filter)

          batch_request = Google::APIClient::BatchRequest.new do |result|
            if result.status == 200
              data = result.data.to_hash
              if data.include? 'items'
                data['items'].each do |item|
                  all_results.push(format_item_data(item))
                end
              end
            else
              @log.append "Error #{result.status} retrieving files with #{SERVICE}: #{result.data['error']['message']}"
            end
          end

          @formats.each do |mime_type|
            batch_request.add(
              api_method: @drive.files.list,
              parameters: {
                trashed:  'false',
                q:        "mime_type = '#{mime_type}'",
                fields:   fields_to_retrieve
              }
            )
          end
          @client.execute(batch_request)

          all_results
        end #get_files_list

        def store_chosen_file(id, url, service, sync_type)
          raise 'Pending implementation'
        end #store_chosen_file

        def download_file(service, id, url)
          raise 'Pending implementation'
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
        # @return { :id, :title, :url, :service }
        def format_item_data(item_data)
          data =
            {
              id:       item_data.fetch('id'),
              title:    item_data.fetch('title'),
              service:  SERVICE
            }
          if item_data.include?('exportLinks')
            data[:url] = item_data.fetch('exportLinks').first.last
            data[:url] = data[:url][0..data[:url].rindex('=')] + 'csv'
          else
            data[:url] = item_data.fetch('downloadUrl')
          end
          data
        end #format_item_data

        # Path to the oauth scope
        # @return string
        def oauth_scope
          'https://www.googleapis.com/auth/drive'
        end #oauth_scope

        # Redirection URI. Generic Google page with authorization token
        # @return string
        def redirect_uri
          'urn:ietf:wg:oauth:2.0:oob'
        end #redirect_uri

        # Path to access token refresh action
        # @return string
        def token_uri
          'https://accounts.google.com/o/oauth2/token'
        end

        # GDrive-formatted string containing list of which fields to fetch
        def fields_to_retrieve
          'items(downloadUrl,etag,exportLinks,fileExtension,id,mimeType,modifiedDate,originalFilename,title)'
        end #fields_to_retrieve

      end #GDrive
    end #FileProviders
  end #Syncronizer
end #CartoDB
