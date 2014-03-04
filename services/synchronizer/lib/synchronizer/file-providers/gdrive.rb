# encoding: utf-8

require_relative 'base'
require 'google/api_client'

module CartoDB
  module Synchronizer
    module FileProviders
      class GDrive < BaseProvider

        # Required for all providers
        SERVICE = 'gdrive'

        # Specific of this provider
        FORMATS_TO_MIME_TYPES = {
            FORMAT_CSV => %W( text/csv ),
            FORMAT_EXCEL => %W( application/vnd.ms-excel application/vnd.google-apps.spreadsheet application/vnd.openxmlformats-officedocument.spreadsheetml.sheet ),
            FORMAT_COMPRESSED => %W( application/zip application/x-compressed-tar application/x-gzip application/x-bzip application/x-tar ),
            FORMAT_PNG => %W( image/png ),
            FORMAT_JPG => %W( image/jpeg ),
            FORMAT_SVG => %W( image/svg+xml )
        }

        def self.get_new(config)
          return new(config)
        end #get_new

        def initialize(config)
          @service_name = SERVICE

          @client = Google::APIClient.new ({
              application_name: config.fetch(:application_name)
          })
          @drive = @client.discovered_api('drive', 'v2')

          @client.authorization.client_id = config.fetch(:client_id)
          @client.authorization.client_secret = config.fetch(:client_secret)
          @client.authorization.scope = oauth_scope
          @client.authorization.redirect_uri = redirect_uri
        end #initialize

        def get_auth_url
          return @client.authorization.authorization_uri
        end #get_auth_url

        def validate_auth_code(auth_code)
          @client.authorization.code = auth_code
          @client.authorization.fetch_access_token!
        end #validate_auth_code

        def get_files_list(formats_filter={})
          all_results = []
          setup_formats_filter(formats_filter)

          batch_request = Google::APIClient::BatchRequest.new do |result|
            if result.status == 200
              data = result.data.to_hash
              if data.include? 'items'
                data['items'].each do |item|
                  all_results.push(item)
                end
              end
            else
              # TODO: Proper log (inject at instantiation)
              puts "An error occurred: #{result.data['error']['message']}"
            end
          end

          @formats.each do |mime_type|
            batch_request.add(
              :api_method => @drive.files.list,
              :parameters => {
                'trashed' => 'false',
                'q' => "mime_type = '#{mime_type}'",
                'fields' => fields_to_retrieve
              }
            )
          end
          @client.execute(batch_request)

          # TODO: Format results [ 'service', 'id', 'title' ]
          all_results
        end #get_files_list


        def store_chosen_files(id, service, sync_type)
          raise 'Pending implementation'
        end #store_chosen_files

        def download_file(service, id)
          raise 'Pending implementation'
        end #download_file

        def setup_formats_filter(filter=[])
          @formats = []
          FORMATS_TO_MIME_TYPES.each do |id, mime_types|
            if (filter.empty? || filter.include?(id))
              mime_types.each do |mime_type|
                @formats = @formats.push(mime_type)
              end
            end
          end
        end #setup_formats_filter

        attr_reader :formats

        private

        def oauth_scope
          'https://www.googleapis.com/auth/drive'
        end #oauth_scope

        def redirect_uri
          'urn:ietf:wg:oauth:2.0:oob'
        end #redirect_uri

        def fields_to_retrieve
          'items(downloadUrl,etag,exportLinks,fileExtension,id,mimeType,modifiedDate,originalFilename,title)'
        end #fields_to_retrieve

      end #GDrive
    end #FileProviders
  end #Syncronizer
end #CartoDB
