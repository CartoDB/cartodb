# encoding: utf-8

require 'google/api_client'
require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      class BigQuery < BaseOAuth

        # Required for all providers
        DATASOURCE_NAME = 'bigquery'

        OAUTH_SCOPE = 'https://www.googleapis.com/auth/bigquery'
        # For when using authorization code instead of callback with token
        REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

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

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME)            if user.nil?

          self.filter=[]
          @refresh_token = nil

          @user = user
          @callback_url = config.fetch('callback_url')
          @client = Google::APIClient.new ({
              application_name: config.fetch('application_name')
          })
          @drive = @client.discovered_api('drive', 'v2')

          @client.authorization.client_id = config.fetch('client_id')
          @client.authorization.client_secret = config.fetch('client_secret')
          @client.authorization.scope = OAUTH_SCOPE
          # By default assume callback with token flow
          @client.authorization.redirect_uri = @callback_url
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

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # @param use_callback_flow : bool
        # @return string | nil
        def get_auth_url(use_callback_flow=true)
          if use_callback_flow
            service_name = service_name_for_user(DATASOURCE_NAME, @user)
            @client.authorization.state = CALLBACK_STATE_DATA_PLACEHOLDER.sub('user', @user.username)
                                                                         .sub('service', service_name)
          else
            @client.authorization.redirect_uri = REDIRECT_URI
          end
          @client.authorization.authorization_uri.to_s
        end

        # Validate authorization code and store token
        # @param auth_code : string
        # @param use_callback_flow : bool
        # @return string : Access token
        # @throws AuthError
        def validate_auth_code(auth_code, use_callback_flow = true)
          unless use_callback_flow
            @client.authorization.redirect_uri = REDIRECT_URI
          end
          @client.authorization.code = auth_code
          @client.authorization.fetch_access_token!
          if @client.authorization.refresh_token.nil?
            raise AuthError.new(
              "Error validating auth token. Is this Google account linked to another CARTO account?",
              DATASOURCE_NAME)
          end
          @refresh_token = @client.authorization.refresh_token
        rescue Google::APIClient::InvalidIDTokenError, Signet::AuthorizationError => ex
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
          @client.authorization.update_token!( { refresh_token: @refresh_token } )
          @client.authorization.fetch_access_token!
        rescue Signet::AuthorizationError, Google::APIClient::InvalidIDTokenError => ex
          raise TokenExpiredOrInvalidError.new("Invalid token: #{ex.message}", DATASOURCE_NAME)
        rescue Google::APIClient::ClientError, \
               Google::APIClient::ServerError, Google::APIClient::BatchError, Google::APIClient::TransmissionError => ex
          raise AuthError.new("setting token: #{ex.message}", DATASOURCE_NAME)
        end

        # Retrieve token
        # @return string | nil
        def token
          @refresh_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ Hash ]
        def get_resources_list(filter=[])
          filter
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        def get_resource(id)
          raise 'Not supported by this datasource'
        end

        # @param id string
        # @return Hash
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        # @throws NotFoundDownloadError
        def get_resource_metadata(id)
          {
            id: id
          }
        end

        # Retrieves current filters. Unused as here there's no get_resources_list
        # @return {}
        def filter
          {}
        end

        # Sets current filters. Unused as here there's no get_resources_list
        # @param filter_data {}
        def filter=(filter_data=[])
          filter_data
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
          result = @client.execute( api_method: @drive.about.get )
          !result.nil?
        rescue Google::APIClient::InvalidIDTokenError
          false
        rescue Google::APIClient::BatchError, Google::APIClient::TransmissionError, Google::APIClient::ClientError, \
               Google::APIClient::ServerError => ex
          raise AuthError.new("token_valid?() #{id}: #{ex.message}", DATASOURCE_NAME)
        end

        # Revokes current set token
        def revoke_token
          http_client = Carto::Http::Client.get('gdrive',
            connecttimeout: 60,
            timeout: 600
            )
          response = http_client.get("https://accounts.google.com/o/oauth2/revoke?token=#{token}")
          if response.code == 200
            true
          end
        rescue => ex
          raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        private

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from GDrive API
        # @return { :id, :title, :url, :service, :checksum, :size }
        def format_item_data(item_data)
          data =
            {
              id:           item_data.fetch('id'),
              title:        item_data.fetch('title'),
              service:      DATASOURCE_NAME,
              checksum:     checksum_of(item_data.fetch('modifiedDate'))

            }
          if item_data.include?('exportLinks')
            # Native spreadsheets  have no format nor direct download links
            data[:url] = item_data.fetch('exportLinks').first.last
            data[:url] = data[:url][0..data[:url].rindex('=')] + 'csv'
            data[:filename] = clean_filename(item_data.fetch('title')) + '.csv'
            data[:size] = NO_CONTENT_SIZE_PROVIDED
          elsif item_data.include?('downloadUrl')
            data[:url] = item_data.fetch('downloadUrl')
            # For Drive files, title == filename + extension
            data[:filename] = item_data.fetch('title')
            data[:size] = item_data.fetch('fileSize').to_i
          else
            # Downloads from files shared by other people can be disabled, ignore them
            CartoDB.notify_debug('Non downloadable file @gdrive', item: item_data.inspect, user: @user)
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
