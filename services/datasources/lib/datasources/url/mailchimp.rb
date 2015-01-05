# encoding: utf-8

require 'typhoeus'
require 'json'
require 'gibbon'
require_relative '../base_oauth'

module CartoDB
  module Datasources
    module Url
      class MailChimp < BaseOAuth

        # Required for all datasources
        DATASOURCE_NAME = 'mailchimp'

        AUTHORIZE_URI = 'https://login.mailchimp.com/oauth2/authorize'
        ACCESS_TOKEN_URI = 'https://login.mailchimp.com/oauth2/token'
        MAILCHIMP_METADATA_URI = 'https://login.mailchimp.com/oauth2/metadata'


        # Constructor
        # @param config Array
        # [
        #  'api_key'
        #  'timeout_minutes'
        # ]
        # @param user User
        # @throws UninitializedError
        # @throws MissingConfigurationError
        def initialize(config, user)
          super

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?
          raise MissingConfigurationError.new('callback_url'. DATASOURCE_NAME) unless config.include?('callback_url')
          raise MissingConfigurationError.new('timeout_minutes', DATASOURCE_NAME) unless config.include?('timeout_minutes')

          @user = user
          @timeout_mins = config.fetch('timeout_minutes')
          @callback_url = config.fetch('callback_url')

          Gibbon::API.timeout = @timeout_mins
          Gibbon::API.throws_exceptions = true
          Gibbon::Export.timeout = @timeout_mins
          Gibbon::Export.throws_exceptions = false

          @access_token = nil
          @api_client = nil
        end

        # Factory method
        # @param config : {}
        # @param user : User
        # @return CartoDB::Datasources::Url::MailChimpLists
        def self.get_new(config, user)
          return new(config, user)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # @param use_callback_flow : bool
        def get_auth_url(use_callback_flow=true)
          if use_callback_flow
            AUTHORIZE_URI
          else
            raise ExternalServiceError.new("This datasource doesn't allows non-callback flows", DATASOURCE_NAME)
          end
        end

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        def validate_auth_code(auth_code)
          raise ExternalServiceError.new("This datasource doesn't allows non-callback flows", DATASOURCE_NAME)
        end

        # Validates the authorization callback
        # @param params : mixed
        def validate_callback(params)
          # TODO: Receives a 'code', must call ACCESS_TOKEN_URI

          # Afterwards, must do another call to metadata endpoint to retrieve API details
          # @see https://apidocs.mailchimp.com/oauth2/





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
          @client = DropboxClient.new(@access_token)
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
            response = @client.search('/', search_query)
            response.each do |item|
              all_results.push(format_item_data(item))
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
          contents,  = @client.get_file_and_metadata(id)
          contents
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

          response = @client.metadata(id)
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
          @client.account_info
          true
        rescue DropboxError => ex
          error_code = ex.http_response.code.to_i
          raise AuthError.new("token_valid? : #{ex.message}") unless (error_code == 401 || error_code == 403)
          false
        end

        # Revokes current set token
        def revoke_token
          @client.disable_access_token
          true
        rescue => ex
          raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        # Sets an error reporting component
        # @param component mixed
        def report_component=(component)
          nil
        end

        private

        # Handles
        # @param original_exception mixed
        # @param message string
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws mixed
        def handle_error(original_exception, message)
          if original_exception.kind_of? DropboxError
            error_code = original_exception.http_response.code.to_i
            if error_code == 401 || error_code == 403
              raise TokenExpiredOrInvalidError.new(message, DATASOURCE_NAME)
            else
              raise AuthError.new(message)
            end
          elsif original_exception.kind_of? ArgumentError
            raise DataDownloadError.new(message, DATASOURCE_NAME)
          else
            raise original_exception
          end
        end

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from Dropbox API
        # @return { :id, :title, :url, :service, :size }
        def format_item_data(item_data)
          filename = item_data.fetch('path').split('/').last

          {
            id:       item_data.fetch('path'),
            title:    filename,
            filename: filename,
            service:  DATASOURCE_NAME,
            checksum: checksum_of(item_data.fetch('rev')),
            size:     item_data.fetch('bytes').to_i
          }
        end

        # Calculates a checksum of given input
        # @param origin string
        # @return string
        def checksum_of(origin)
          #noinspection RubyArgCount
          Zlib::crc32(origin).to_s
        end

      end
    end
  end
end
