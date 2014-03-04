# encoding: utf-8

require 'google/api_client'

module CartoDB
  module Synchronizer
    module FileProviders
      class GDrive

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

        def get_new(config)
          return GDrive.new(config)
        end

        def initialize(config)
          @service_name = SERVICE

          @client = Google::APIClient.new ({
              application_name: config.fetch('application_name')
          })
          @drive = @client.discovered_api('drive', 'v2')

          @client.authorization.client_id = config.fetch('client_id')
          @client.authorization.client_secret = config.fetch('client_secret')
          @client.authorization.scope = oauth_scope
          @client.authorization.redirect_uri = redirect_uri
        end

        def get_auth_url
          return @client.authorization.authorization_uri
        end

        def validate_auth_token(token)
          @client.authorization.code = token
          @client.authorization.fetch_access_token!
        end

        def get_files_list(formats_filter={})
          if formats_filter.empty?
            @formats = SUPPORTED_FORMATS
          else
            @formats = []
            formats_filter.each do |id, mime_types|
              @formats = @formats.push(mime_types)
            end
          end

          # [ 'service', 'id', 'title' ]
          raise 'To be implemented in child classes'
        end

        def store_chosen_files(id, service, sync_type)
          raise 'To be implemented in child classes'
        end

        def download_file(service, id)
          raise 'To be implemented in child classes'
        end

        private

        def oauth_scope
          'https://www.googleapis.com/auth/drive'
        end

        def redirect_uri
          'urn:ietf:wg:oauth:2.0:oob'
        end

        def fields_to_retrieve
          'items(downloadUrl,etag,exportLinks,fileExtension,id,mimeType,modifiedDate,originalFilename,title)'
        end

        def test_method

        end


      end #GDrive
    end #FileProviders
  end #Syncronizer
end #CartoDB
