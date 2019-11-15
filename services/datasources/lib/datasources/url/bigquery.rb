# encoding: utf-8

require 'signet/oauth_2/client'
require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      class BigQuery < BaseOAuth

        # Required for all providers
        DATASOURCE_NAME = 'bigquery'

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

          @user = user

          self.filter = []
          @refresh_token = nil

          @client = Signet::OAuth2::Client.new(
            authorization_uri: config.fetch('authorization_uri'),
            token_credential_uri:  config.fetch('token_credential_uri'),
            client_id: config.fetch('client_id'),
            client_secret: config.fetch('client_secret'),
            scope: config.fetch('scope'),
            redirect_uri: config.fetch('callback_url'),
            access_type: :offline
          )
          @revoke_uri = config.fetch('revoke_auth_uri')
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
        # @return string | nil
        def get_auth_url()
          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          @client.state = CALLBACK_STATE_DATA_PLACEHOLDER.sub('user', @user.username)
                                                         .sub('service', service_name)
          @client.authorization_uri.to_s
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

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        # @throws AuthError
        def validate_auth_code(auth_code)
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

        # Store the refresh token
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
          @client.fetch_access_token!
          true
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError
          false
        rescue Google::Apis::BatchError, Google::Apis::TransmissionError, Google::Apis::ClientError, \
               Google::Apis::ServerError => ex
          raise AuthError.new("token_valid?(): #{ex.message}", DATASOURCE_NAME)
        end

        # Revokes current set token
        def revoke_token
          http_client = Carto::Http::Client.get(DATASOURCE_NAME,
            connecttimeout: 60,
            timeout: 600
          )
          response = http_client.get("#{@revoke_uri}?token=#{token}")
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
