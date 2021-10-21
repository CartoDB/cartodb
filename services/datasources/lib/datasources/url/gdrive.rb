require 'signet/oauth_2/client'
require 'google/apis/drive_v2'
require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      class GDrive < BaseOAuth

        # Required for all providers
        DATASOURCE_NAME = 'gdrive'

        OAUTH_SCOPES = ['https://www.googleapis.com/auth/drive'].freeze
        # For when using authorization code instead of callback with token
        REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'
        FIELDS_TO_RETRIEVE = 'items(downloadUrl,exportLinks,id,modifiedDate,title,fileExtension,fileSize)'

        # Specific of this provider
        FORMATS_TO_MIME_TYPES = {
          FORMAT_CSV =>        %w(text/csv),
          FORMAT_EXCEL =>      %w(application/vnd.ms-excel application/vnd.google-apps.spreadsheet application/vnd.openxmlformats-officedocument.spreadsheetml.sheet),
          # FORMAT_GPX =>        %w(text/xml), # Disabled because text/xml list any XML file
          FORMAT_KML =>        %w(application/vnd.google-earth.kml+xml),
          FORMAT_COMPRESSED => %w(application/zip application/x-zip-compressed), # application/x-compressed-tar application/x-gzip application/x-bzip application/x-tar )
        }

        # Constructor (hidden)
        # @param config
        # [
        #  'application_name'
        #  'client_id'
        #  'client_secret'
        # ]
        # @param user ::User
        # @throws UninitializedError
        # @throws MissingConfigurationError
        def initialize(config, user)
          super(config, user, %w{ application_name client_id client_secret callback_url }, DATASOURCE_NAME)

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?

          self.filter=[]
          @refresh_token = nil

          @user = user
          @callback_url = config.fetch('callback_url')
          @client = Signet::OAuth2::Client.new(
            authorization_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_credential_uri:  'https://oauth2.googleapis.com/token',
            client_id: config.fetch('client_id'),
            client_secret: config.fetch('client_secret'),
            scope: OAUTH_SCOPES,
            redirect_uri: @callback_url,
            access_type: :offline
          )
          @drive = Google::Apis::DriveV2::DriveService.new
          @drive.authorization = @client
        end

        # Factory method
        # @param config {}
        # @param user ::User
        # @return CartoDB::Datasources::Url::GDrive
        def self.get_new(config, user)
          new(config, user)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Return the url to be displayed or sent the user to authenticate and get authorization code
        # @param use_callback_flow : bool
        # @return string | nil
        def get_auth_url(use_callback_flow = true)
          if use_callback_flow
            service_name = service_name_for_user(DATASOURCE_NAME, @user)
            @client.state = CALLBACK_STATE_DATA_PLACEHOLDER.sub('service', service_name)
                                                           .sub('user', @user.username)
          else
            @client.redirect_uri = REDIRECT_URI
          end
          @client.authorization_uri.to_s
        end

        # Validate authorization code and store token
        # @param auth_code : string
        # @param use_callback_flow : bool
        # @return string : Access token
        # @throws AuthError
        def validate_auth_code(auth_code, use_callback_flow = true)
          unless use_callback_flow
            @client.redirect_uri = REDIRECT_URI
          end
          @client.code = auth_code
          @client.fetch_access_token!
          if @client.refresh_token.nil?
            raise AuthError.new(
              "Error validating auth token. Is this Google account linked to another CARTO account?",
              DATASOURCE_NAME
            )
          end
          @refresh_token = @client.refresh_token
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError => ex
          raise AuthError.new("validating auth code: #{ex.message}", DATASOURCE_NAME)
        end

        # Validates the authorization callback
        # @param params : mixed
        def validate_callback(params)
          if params[:error].present?
            raise AuthError.new("validate_callback: #{params[:error]}", DATASOURCE_NAME)
          end

          if params[:code]
            validate_auth_code(params[:code])
          else
            raise AuthError.new('validate_callback: Missing authorization code', DATASOURCE_NAME)
          end
        end

        # Store token
        # Triggers generation of a valid access token for the lifetime of this instance
        # @param token string
        # @throws AuthError
        def token=(token)
          @refresh_token = token
          @client.update_token!(refresh_token: @refresh_token)
          @client.fetch_access_token!
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError => ex
          raise TokenExpiredOrInvalidError.new("Invalid token: #{ex.message}", DATASOURCE_NAME)
        rescue Google::Apis::ClientError, \
               Google::Apis::ServerError, Google::Apis::BatchError, Google::Apis::TransmissionError => ex
          raise AuthError.new("setting token: #{ex.message}", DATASOURCE_NAME)
        end

        # Retrieve token
        # @return string | nil
        def token
          @refresh_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        def get_resources_list(filter=[])
          all_results = []
          self.filter = filter

          @drive.batch do |d|
            @formats.each do |mime_type|
              d.list_files(q: "mime_type = '#{mime_type}'", fields: FIELDS_TO_RETRIEVE) do |res, err|
                if err
                  case err.status_code
                  when 200
                    break
                  when 403
                    raise GDriveNoExternalAppsAllowedError.new(result.data['error']['message'], DATASOURCE_NAME)
                  else
                    error_msg = "get_resources_list() #{result.data['error']['message']} (#{result.status})"
                    raise DataDownloadError.new(error_msg, DATASOURCE_NAME)
                  end
                elsif res.items.present?
                  res.items.each do |item|
                    all_results.push(format_item_data(item))
                  end
                end
              end
            end
          end

          all_results.compact
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError => ex
          raise TokenExpiredOrInvalidError.new("Invalid token: #{ex.message}", DATASOURCE_NAME)
        rescue Google::Apis::BatchError, Google::Apis::TransmissionError, Google::Apis::ClientError, \
               Google::Apis::ServerError => ex
          raise DataDownloadError.new("getting resources: #{ex.message}", DATASOURCE_NAME)
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        def get_resource(id)
          @drive.get_file(id) do |file, err|
            if err
              error_msg = "(#{err.status_code}) retrieving file #{id}: #{err}"
              raise DataDownloadError.new(error_msg, DATASOURCE_NAME)
            end
            if file.export_links.present?
              @drive.http(:get, file.export_links['text/csv'], download_dest: StringIO.new) do |content, export_err|
                raise export_err if export_err

                # NOTE: Reinitializing StringIO due to 'content' is not readable
                return StringIO.new(content.string)
              end
            else
              @drive.get_file(file.id, download_dest: StringIO.new) do |content, download_err|
                raise download_err if download_err

                return content
              end
            end
          end
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError => e
          raise TokenExpiredOrInvalidError.new("Invalid token: #{e.message}", DATASOURCE_NAME)
        rescue Google::Apis::BatchError, Google::Apis::TransmissionError, Google::Apis::ClientError, \
               Google::Apis::ServerError => e
          raise DataDownloadError.new("downloading file #{id}: #{e.message}", DATASOURCE_NAME)
        end

        # @param id string
        # @return Hash
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        # @throws NotFoundDownloadError
        def get_resource_metadata(id)
          @drive.get_file(id) do |file, err|
            if err
              case err.status_code
              when 404
                error_msg = "(#{err.status_code}) retrieving file #{id} metadata: #{err}, should stop syncing"
                raise NotFoundDownloadError.new(error_msg, DATASOURCE_NAME)
              else
                error_msg = "(#{err.status_code}) retrieving file #{id} metadata: #{err}"
                raise DataDownloadError.new(error_msg, DATASOURCE_NAME)
              end
            else
              item_data = format_item_data(file)
              return item_data.to_hash
            end
          end
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError
          raise TokenExpiredOrInvalidError.new('Invalid token', DATASOURCE_NAME)
        rescue Google::Apis::BatchError, Google::Apis::TransmissionError, Google::Apis::ClientError, \
               Google::Apis::ServerError
          raise DataDownloadError.new("get_resource_metadata() #{id}", DATASOURCE_NAME)
        rescue StandardError => e
          CartoDB.notify_exception(e, id: id, user: @user)
          raise e
        end

        # Retrieves current filters
        # @return {}
        def filter
          @formats
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
          @formats = []
          FORMATS_TO_MIME_TYPES.each do |id, mime_types|
            if filter_data.empty? || filter_data.include?(id)
              mime_types.each do |mime_type|
                @formats = @formats.push(mime_type)
              end
            end
          end
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

        # Checks if token is still valid or has been revoked
        # @return bool
        # @throws AuthError
        def token_valid?
          # Any call would do, we just want to see if communicates or refuses the token
          result = @drive.get_about
          !result.nil?
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError
          false
        rescue Google::Apis::BatchError, Google::Apis::TransmissionError, Google::Apis::ClientError, \
               Google::Apis::ServerError => ex
          raise AuthError.new("token_valid?() #{id}: #{ex.message}", DATASOURCE_NAME)
        end

        # Revokes current set token
        def revoke_token
          http_client = Carto::Http::Client.get('gdrive',
                                                connecttimeout: 60,
                                                timeout: 600)
          response = http_client.get("https://accounts.google.com/o/oauth2/revoke?token=#{token}")
          if response.code == 200
            true
          end
        rescue StandardError => ex
          raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        private

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from GDrive API
        # @return { :id, :title, :url, :service, :checksum, :size }
        def format_item_data(item_data)
          data =
            {
              id:           item_data.id,
              title:        item_data.title,
              service:      DATASOURCE_NAME,
              checksum:     checksum_of(item_data.modified_date.to_s)

            }
          if item_data.export_links.present?
            # Native spreadsheets have no format nor direct download links
            data[:url] = item_data.export_links.first.last
            data[:url] = data[:url][0..data[:url].rindex('=')] + 'csv'
            data[:filename] = clean_filename(item_data.title) + '.csv'
            data[:size] = NO_CONTENT_SIZE_PROVIDED
          elsif item_data.download_url.present?
            data[:url] = item_data.download_url
            # For Drive files, title == filename + extension
            data[:filename] = item_data.title
            data[:size] = item_data.file_size.to_i
          else
            # Downloads from files shared by other people can be disabled, ignore them
            return nil
          end
          data
        end

        def clean_filename(name)
          clean_name = ''
          name.gsub(' ','_').scan(/([a-zA-Z0-9_]+)/).flatten.map { |match|
            clean_name << match
          }
          clean_name = name if clean_name.size == 0

          clean_name
        end
      end
    end
  end
end
