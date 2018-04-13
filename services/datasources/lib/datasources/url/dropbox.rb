# encoding: utf-8

require 'dropbox_api'
require_relative '../base_oauth'
require_relative '../../../../../lib/dropbox_api/endpoints/auth/token/revoke'

module CartoDB
  module Datasources
    module Url
      # In order to test Dropbox in local, do the following:
      # 1. In Dropbox, change OAuth2 configuration, adding this (replace username and API key as needed):
      #    http://localhost:3000/u/juanignaciosl/api/v1/imports/service/dropbox/oauth_callback/?api_key=3312b39c6360862e13217a8aec540e57367f4a4b
      # 2. Configure it in app_config.yml:
      #    dropbox:
      #      app_key:              '528omteaww7fj86'
      #      app_secret:           'rhx2ovpuni266ra'
      #      callback_url:         'http://localhost:3000/u/juanignaciosl/api/v1/imports/service/dropbox/oauth_callback/?api_key=3312b39c6360862e13217a8aec540e57367f4a4b'
      #    This obviously will work for a single user.
      class Dropbox < BaseOAuth

        # Required for all datasources
        DATASOURCE_NAME = 'dropbox'

        # Specific of this datasource
        FORMATS_TO_SEARCH_QUERIES = {
            FORMAT_CSV =>         %W( .csv ),
            FORMAT_EXCEL =>       %W( .xls .xlsx ),
            FORMAT_GPX =>         %W( .gpx ),
            FORMAT_KML =>         %W( .kml ),
            FORMAT_COMPRESSED =>  %W( .zip )
        }

        # Constructor
        # @param config Array
        # [
        #  'app_key'
        #  'app_secret'
        #  'callback_url'
        # ]
        # @param user ::User
        # @throws UninitializedError
        # @throws MissingConfigurationError
        def initialize(config, user)
          super(config, user, %w{ app_key app_secret callback_url }, DATASOURCE_NAME)

          @user               = user
          @app_key            = config.fetch('app_key')
          @app_secret         = config.fetch('app_secret')
          @callback_url       = config.fetch('callback_url')

          self.filter   = []
          @access_token = nil
          @auth_flow    = nil
          @client       = nil
        end

        # Factory method
        # @param config : {}
        # @param user : ::User
        # @return CartoDB::Datasources::Url::Dropbox
        def self.get_new(config, user)
          return new(config, user)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # Older implementations had a use_callback_flow parameter that became deprecated. Not implemented.
        # @throws AuthError
        def get_auth_url
          authenticator.authorize_url redirect_uri: @callback_url, state: state
        rescue => ex
          raise AuthError.new("get_auth_url(#{use_callback_flow}): #{ex.message}", DATASOURCE_NAME)
        end

        # Validates the authorization callback
        # @param params : mixed
        def validate_callback(params)
          raise "state doesn't match" unless params[:state] == state
          auth_bearer = authenticator.get_token(params[:code], redirect_uri: @callback_url)
          @access_token = auth_bearer.token

          @client = DropboxApi::Client.new(@access_token)
          @access_token
        rescue => ex
          raise AuthError.new("validate_callback(#{params.inspect}): #{ex.message}", DATASOURCE_NAME)
        end

        # Set the token
        # @param token string
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        def token=(token)
          @access_token = token
          @client = DropboxApi::Client.new(@access_token)
        rescue => ex
          handle_error(ex, "token= : #{ex.message}")
        end

        # Retrieve set token
        # @return string | nil
        def token
          @access_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws DataDownloadError
        def get_resources_list(filter=[])
          all_results = []
          self.filter = filter

          @formats.each do |search_query|
            start = 0
            loop do
              response = @client.search(search_query, '', max_results: SEARCH_BATCH_SIZE, start: start)
              response.matches.select { |item| item.resource.is_a?(DropboxApi::Metadata::File) }.each do |item|
                all_results.push(format_item_data(item.resource))
              end
              break unless response.has_more?
              start += SEARCH_BATCH_SIZE
            end
          end
          all_results
        rescue => ex
          handle_error(ex, "get_resources_list(): #{ex.message}")
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws DataDownloadError
        def get_resource(id)
          file_contents = ''
          @client.download(id) do |chunk|
            file_contents << chunk
          end
          file_contents
        rescue => ex
          handle_error(ex, "get_resource() #{id}: #{ex.message}")
        end

        # @param id string
        # @return Hash
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws DataDownloadError
        def get_resource_metadata(id)
          raise DropboxPermissionError.new('No Dropbox client', DATASOURCE_NAME) unless @client.present?

          response = @client.get_metadata(id)
          item_data = format_item_data(response)

          item_data.to_hash
        rescue => ex
          handle_error(ex, "get_resource_metadata() #{id}: #{ex.message}")
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
          FORMATS_TO_SEARCH_QUERIES.each do |id, queries|
            if filter_data.empty? || filter_data.include?(id)
              queries.each do |query|
                @formats = @formats.push(query)
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
          @client.get_current_account
          true
        rescue DropboxApi::Errors::HttpError => ex
          CartoDB::Logger.debug(message: 'Invalid Dropbox token', exception: ex, user: @user)
          false
        end

        # Revokes current set token
        def revoke_token
          @client.revoke
          true
        rescue DropboxApi::Errors::HttpError => ex
          CartoDB::Logger.debug(message: 'Error revoking Dropbox token', exception: ex, user: @user)
          true
        rescue => ex
          raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        private

        SEARCH_BATCH_SIZE = 1000

        # Handles
        # @param original_exception mixed
        # @param message string
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws mixed
        def handle_error(original_exception, message)
          if original_exception.is_a? DropboxApi::Errors::NotFoundError
            raise NotFoundDownloadError.new(message, DATASOURCE_NAME)
          elsif original_exception.is_a? DropboxApi::Errors::BasicError
            error_code = original_exception.http_response.code.to_i
            if error_code == 401 || error_code == 403
              raise TokenExpiredOrInvalidError.new(message, DATASOURCE_NAME)
            else
              raise AuthError.new(message)
            end
          elsif original_exception.is_a? ArgumentError
            raise DataDownloadError.new(message, DATASOURCE_NAME)
          else
            raise original_exception
          end
        end

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from Dropbox API
        # @return { :id, :title, :url, :service, :size }
        def format_item_data(resource)
          path = resource.path_display
          filename = path.split('/').last

          {
            id:       path,
            title:    filename,
            filename: filename,
            service:  DATASOURCE_NAME,
            checksum: checksum_of(resource.rev),
            size:     resource.size
          }
        end

        def authenticator
          @authenticator ||= DropboxApi::Authenticator.new(@app_key, @app_secret)
        end

        def state
          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          CALLBACK_STATE_DATA_PLACEHOLDER.sub('user', @user.username).sub('service', service_name)
        end
      end
    end
  end
end
